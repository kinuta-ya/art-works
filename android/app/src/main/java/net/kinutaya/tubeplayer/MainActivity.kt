package net.kinutaya.tubeplayer

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.DocumentsContract
import android.view.KeyEvent
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.util.concurrent.Executors

/**
 * Tube Player（試作版）
 *
 * - 画面は Web 版（アプリに同梱した public/）を WebView で表示する。
 *   https://appassets.androidplatform.net/assets/www/ から配信するので、Web 版と同じように動く。
 * - SD カードの音楽フォルダーは、Android の「フォルダーを選ぶ」画面で選んでもらい、
 *   中身の一覧を画面側へ渡す。ファイルの中身は /sd/<番号> で必要な部分だけ配信する。
 * - 選んだフォルダーは覚えておき、次に起動したときに自動で読み込む。
 * - M8T 本体の曲送り・曲戻し・再生ボタンを画面側へ伝える。
 */
class MainActivity : Activity() {

    companion object {
        private const val HOST = "appassets.androidplatform.net"
        private const val REQ_TREE = 1
        private const val REQ_FILES = 2
        private const val PREF_TREE = "tree"

        // 一覧に含めるファイル（音楽・ジャケット画像・CUE シート・歌詞）
        private val WANTED = setOf(
            "flac", "mp3", "m4a", "aac", "mp4", "alac", "wav", "wave", "aif", "aiff",
            "ogg", "oga", "opus", "dsf", "dff",
            "jpg", "jpeg", "png", "webp", "cue", "lrc",
        )
    }

    private lateinit var web: WebView
    private lateinit var assets: WebViewAssetLoader
    private val io = Executors.newSingleThreadExecutor()
    private val prefs by lazy { getSharedPreferences("tube", MODE_PRIVATE) }

    // 一覧にしたファイル（番号 → Uri）。/sd/<番号> で配信する
    @Volatile private var files: List<Uri> = emptyList()
    @Volatile private var pendingJson: String = "[]"
    private var fileCallback: ValueCallback<Array<Uri>>? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WebView.setWebContentsDebuggingEnabled(true)
        assets = WebViewAssetLoader.Builder()
            .setDomain(HOST)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this)
        setContentView(web)
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
        }
        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                val url = request.url
                if (url.host == HOST && (url.path ?: "").startsWith("/sd/")) return serveSd(url)
                return assets.shouldInterceptRequest(url)
            }
        }
        // <input type="file">（歌詞ファイルの読み込み、ファイルを追加）で、ファイルを選ぶ画面を開く
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                return try {
                    val intent = params.createIntent().apply {
                        if (params.mode == FileChooserParams.MODE_OPEN_MULTIPLE) putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                    }
                    @Suppress("DEPRECATION")
                    startActivityForResult(intent, REQ_FILES)
                    true
                } catch (e: Exception) {
                    fileCallback = null
                    false
                }
            }
        }
        web.addJavascriptInterface(Bridge(), "TubeBridge")
        web.loadUrl("https://$HOST/assets/www/index.html")
    }

    // ---------- 画面側から呼ばれる関数 ----------
    inner class Bridge {
        /** フォルダーを選ぶ画面を開く */
        @JavascriptInterface
        fun pickFolder() {
            runOnUiThread {
                val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
                }
                @Suppress("DEPRECATION")
                startActivityForResult(intent, REQ_TREE)
            }
        }

        /** 前に選んだフォルダーがあるか */
        @JavascriptInterface
        fun hasFolder(): Boolean = savedTree() != null

        /** 前に選んだフォルダーの名前 */
        @JavascriptInterface
        fun folderName(): String = savedTree()?.let { displayName(it, DocumentsContract.getTreeDocumentId(it)) } ?: ""

        /** 前に選んだフォルダーを読み直す */
        @JavascriptInterface
        fun rescan(): Boolean {
            val tree = savedTree() ?: return false
            scan(tree)
            return true
        }

        /** 一覧（JSON）を受け取る */
        @JavascriptInterface
        fun takeFolderJson(): String {
            val s = pendingJson
            pendingJson = "[]"
            return s
        }

        /** アプリの版 */
        @JavascriptInterface
        fun version(): String = try {
            packageManager.getPackageInfo(packageName, 0).versionName ?: ""
        } catch (e: Exception) { "" }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQ_FILES) {
            val clip = data?.clipData
            val uris = if (resultCode == RESULT_OK && clip != null) Array(clip.itemCount) { clip.getItemAt(it).uri }
                else WebChromeClient.FileChooserParams.parseResult(resultCode, data)
            fileCallback?.onReceiveValue(uris)
            fileCallback = null
            return
        }
        if (requestCode != REQ_TREE) return
        val tree = data?.data
        if (resultCode != RESULT_OK || tree == null) {
            js("window.TubeAndroid && TubeAndroid.onCancel()")
            return
        }
        // 次に起動したときも読めるように、読み取りの許可を保存する
        try {
            contentResolver.takePersistableUriPermission(tree, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        } catch (e: SecurityException) { /* 保存できなくても今回は読める */ }
        prefs.edit().putString(PREF_TREE, tree.toString()).apply()
        scan(tree)
    }

    private fun savedTree(): Uri? {
        val s = prefs.getString(PREF_TREE, null) ?: return null
        val uri = Uri.parse(s)
        val ok = contentResolver.persistedUriPermissions.any { it.uri == uri && it.isReadPermission }
        return if (ok) uri else null
    }

    // ---------- フォルダーの中身を一覧にする ----------
    private fun scan(tree: Uri) {
        js("window.TubeAndroid && TubeAndroid.onScanStart()")
        io.execute {
            val list = ArrayList<Uri>()
            val out = JSONArray()
            try {
                val rootId = DocumentsContract.getTreeDocumentId(tree)
                val rootName = displayName(tree, rootId) ?: "Music"
                walk(tree, rootId, rootName, list, out)
            } catch (e: Exception) {
                js("window.TubeAndroid && TubeAndroid.onError(${JSONObject.quote(e.message ?: e.toString())})")
                return@execute
            }
            files = list
            pendingJson = out.toString()
            js("window.TubeAndroid && TubeAndroid.onFolderReady()")
        }
    }

    private fun walk(tree: Uri, docId: String, rel: String, list: ArrayList<Uri>, out: JSONArray) {
        val children = DocumentsContract.buildChildDocumentsUriUsingTree(tree, docId)
        val cols = arrayOf(
            DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            DocumentsContract.Document.COLUMN_MIME_TYPE,
            DocumentsContract.Document.COLUMN_SIZE,
        )
        val dirs = ArrayList<Pair<String, String>>()
        contentResolver.query(children, cols, null, null, null)?.use { c ->
            while (c.moveToNext()) {
                val id = c.getString(0) ?: continue
                val name = c.getString(1) ?: continue
                val mime = c.getString(2) ?: ""
                val path = "$rel/$name"
                if (mime == DocumentsContract.Document.MIME_TYPE_DIR) {
                    if (!name.startsWith(".")) dirs.add(id to path)
                    continue
                }
                val ext = name.substringAfterLast('.', "").lowercase()
                if (ext !in WANTED) continue
                val n = list.size
                list.add(DocumentsContract.buildDocumentUriUsingTree(tree, id))
                out.put(JSONObject().put("n", n).put("path", path).put("name", name).put("size", if (c.isNull(3)) 0 else c.getLong(3)).put("mime", mime))
                if (n % 200 == 0 && n > 0) js("window.TubeAndroid && TubeAndroid.onProgress($n)")
            }
        }
        for ((id, path) in dirs) walk(tree, id, path, list, out)
    }

    private fun displayName(tree: Uri, docId: String): String? {
        val uri = DocumentsContract.buildDocumentUriUsingTree(tree, docId)
        return try {
            contentResolver.query(uri, arrayOf(DocumentsContract.Document.COLUMN_DISPLAY_NAME), null, null, null)?.use { c ->
                if (c.moveToFirst()) c.getString(0) else null
            }
        } catch (e: Exception) { null }
    }

    // ---------- ファイルの中身を配信する ----------
    // /sd/<番号>          ファイル全体
    // /sd/<番号>?s=&l=    s バイト目から l バイト（タグの解析など、一部だけ読むとき）
    private fun serveSd(url: Uri): WebResourceResponse {
        val headers = mapOf("Cache-Control" to "no-store", "Access-Control-Allow-Origin" to "*")
        val n = url.lastPathSegment?.toIntOrNull()
        val uri = n?.let { files.getOrNull(it) }
            ?: return WebResourceResponse("text/plain", "utf-8", 404, "Not Found", headers, ByteArrayInputStream(ByteArray(0)))
        return try {
            val start = url.getQueryParameter("s")?.toLongOrNull()
            val len = url.getQueryParameter("l")?.toIntOrNull()
            val mime = contentResolver.getType(uri) ?: "application/octet-stream"
            if (start != null && len != null) {
                val bytes = readRange(uri, start, len)
                WebResourceResponse(mime, null, 200, "OK", headers, ByteArrayInputStream(bytes))
            } else {
                val input = contentResolver.openInputStream(uri) ?: throw IllegalStateException("開けませんでした")
                WebResourceResponse(mime, null, 200, "OK", headers, input)
            }
        } catch (e: Exception) {
            WebResourceResponse("text/plain", "utf-8", 500, "Error", headers, ByteArrayInputStream((e.message ?: "").toByteArray()))
        }
    }

    private fun readRange(uri: Uri, start: Long, len: Int): ByteArray {
        val pfd = contentResolver.openFileDescriptor(uri, "r") ?: throw IllegalStateException("開けませんでした")
        pfd.use {
            FileInputStream(it.fileDescriptor).use { input ->
                val ch = input.channel
                val n = maxOf(0L, minOf(len.toLong(), ch.size() - start)).toInt()
                val buf = ByteBuffer.allocate(n)
                var pos = start
                while (buf.hasRemaining()) {
                    val r = ch.read(buf, pos)
                    if (r <= 0) break
                    pos += r
                }
                return buf.array().copyOf(buf.position())
            }
        }
    }

    // ---------- 本体のボタン ----------
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        val action = when (event.keyCode) {
            KeyEvent.KEYCODE_MEDIA_NEXT -> if (event.repeatCount > 0) "ff" else "next"
            KeyEvent.KEYCODE_MEDIA_PREVIOUS -> if (event.repeatCount > 0) "rew" else "prev"
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> "ff"
            KeyEvent.KEYCODE_MEDIA_REWIND -> "rew"
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, KeyEvent.KEYCODE_HEADSETHOOK -> "toggle"
            KeyEvent.KEYCODE_MEDIA_PLAY -> "play"
            KeyEvent.KEYCODE_MEDIA_PAUSE -> "pause"
            else -> null
        } ?: return super.dispatchKeyEvent(event)
        if (event.action == KeyEvent.ACTION_DOWN) {
            // 長押しは押している間の繰り返しで早送り・早戻し。単押しは離したときではなく押したときに反応する
            if (event.repeatCount == 0 || action == "ff" || action == "rew") js("window.TubeAndroid && TubeAndroid.key('$action')")
        }
        return true
    }

    // 戻るボタン：再生画面やツール画面を閉じる。閉じるものが無ければ、再生を続けたまま裏に回る
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        web.evaluateJavascript("window.TubeAndroid ? TubeAndroid.back() : false") { handled ->
            if (handled != "true") moveTaskToBack(true)
        }
    }

    // 画面側の関数を呼ぶ（どのスレッドから呼ばれても、画面用のスレッドで実行する）
    private fun js(code: String) {
        runOnUiThread { if (::web.isInitialized) web.evaluateJavascript(code, null) }
    }

    override fun onDestroy() {
        io.shutdownNow()
        web.destroy()
        super.onDestroy()
    }
}

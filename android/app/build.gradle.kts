// Tube Player（試作版）：Web 版の画面を WebView で表示し、SD カードの読み込みと本体ボタンを Android 側で受け持つ
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val runNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

android {
    namespace = "net.kinutaya.tubeplayer"
    compileSdk = 34

    defaultConfig {
        applicationId = "net.kinutaya.tubeplayer"
        minSdk = 26
        targetSdk = 34
        versionCode = runNumber
        versionName = "0.1.$runNumber"
    }

    // 試作版は、どのビルドでも同じ署名にする（上書きインストールできるように）。
    // 公開用ではないデバッグ専用の鍵。
    signingConfigs {
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }
    buildTypes {
        getByName("debug") {
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    // Web 版（リポジトリの public/）を、ビルドのたびにアプリへ同梱する
    sourceSets {
        getByName("main") {
            assets.srcDir("build/generated/webassets")
        }
    }
}

val copyWeb by tasks.registering(Sync::class) {
    from(rootProject.file("../public"))
    into(layout.buildDirectory.dir("generated/webassets/www"))
}
tasks.named("preBuild") { dependsOn(copyWeb) }

dependencies {
    implementation("androidx.webkit:webkit:1.11.0")
}

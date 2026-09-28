// タグ・音声フォーマット解析（FLAC / MP3(ID3v2) / M4A / WAV）
// 外部ライブラリなし。File.slice で必要な部分だけ読む。
(function (MP) {
  'use strict';

  const AUDIO_EXT = ['flac', 'mp3', 'm4a', 'aac', 'mp4', 'alac', 'wav', 'wave', 'aif', 'aiff', 'ogg', 'oga', 'opus', 'dsf', 'dff'];
  const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp'];

  function ext(name) {
    const i = name.lastIndexOf('.');
    return i < 0 ? '' : name.slice(i + 1).toLowerCase();
  }

  async function readBytes(file, start, length) {
    const end = Math.min(file.size, start + length);
    if (start >= end) return new Uint8Array(0);
    return new Uint8Array(await file.slice(start, end).arrayBuffer());
  }

  function u32be(b, o) { return ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3]; }
  function u24be(b, o) { return (b[o] << 16) + (b[o + 1] << 8) + b[o + 2]; }
  function u16be(b, o) { return (b[o] << 8) + b[o + 1]; }
  function u32le(b, o) { return (b[o] + (b[o + 1] << 8) + (b[o + 2] << 16) + ((b[o + 3] << 24) >>> 0)) >>> 0; }
  function u16le(b, o) { return b[o] + (b[o + 1] << 8); }
  function syncsafe(b, o) { return (b[o] << 21) | (b[o + 1] << 14) | (b[o + 2] << 7) | b[o + 3]; }
  function ascii(b, o, n) { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(b[o + i]); return s; }

  const utf8 = new TextDecoder('utf-8');
  const latin1 = new TextDecoder('latin1');
  const utf16le = new TextDecoder('utf-16le');
  const utf16be = new TextDecoder('utf-16be');

  // ID3v1 のジャンル番号（0〜79 の標準分）
  const ID3_GENRES = ['Blues', 'Classic Rock', 'Country', 'Dance', 'Disco', 'Funk', 'Grunge', 'Hip-Hop', 'Jazz', 'Metal',
    'New Age', 'Oldies', 'Other', 'Pop', 'R&B', 'Rap', 'Reggae', 'Rock', 'Techno', 'Industrial',
    'Alternative', 'Ska', 'Death Metal', 'Pranks', 'Soundtrack', 'Euro-Techno', 'Ambient', 'Trip-Hop', 'Vocal', 'Jazz+Funk',
    'Fusion', 'Trance', 'Classical', 'Instrumental', 'Acid', 'House', 'Game', 'Sound Clip', 'Gospel', 'Noise',
    'Alternative Rock', 'Bass', 'Soul', 'Punk', 'Space', 'Meditative', 'Instrumental Pop', 'Instrumental Rock', 'Ethnic', 'Gothic',
    'Darkwave', 'Techno-Industrial', 'Electronic', 'Pop-Folk', 'Eurodance', 'Dream', 'Southern Rock', 'Comedy', 'Cult', 'Gangsta',
    'Top 40', 'Christian Rap', 'Pop/Funk', 'Jungle', 'Native American', 'Cabaret', 'New Wave', 'Psychedelic', 'Rave', 'Showtunes',
    'Trailer', 'Lo-Fi', 'Tribal', 'Acid Punk', 'Acid Jazz', 'Polka', 'Retro', 'Musical', 'Rock & Roll', 'Hard Rock'];

  // "(17)" "17" "(17)Rock" などを名前に直す
  function genreName(v) {
    if (v == null) return null;
    const s = String(v).split('\0')[0].trim();
    const m = s.match(/^\((\d+)\)(.*)$/);
    if (m) return m[2].trim() || ID3_GENRES[+m[1]] || null;
    if (/^\d+$/.test(s)) return ID3_GENRES[+s] || null;
    return s || null;
  }

  function parseNum(v) {
    if (v == null) return null;
    const n = parseInt(String(v).split('/')[0], 10);
    return Number.isFinite(n) ? n : null;
  }

  // ---------- FLAC ----------
  async function parseFlac(file, meta) {
    let pos = 4;
    for (let guard = 0; guard < 64; guard++) {
      const h = await readBytes(file, pos, 4);
      if (h.length < 4) break;
      const last = (h[0] & 0x80) !== 0;
      const type = h[0] & 0x7f;
      const len = u24be(h, 1);
      pos += 4;
      if (type === 0) { // STREAMINFO
        const b = await readBytes(file, pos, 18);
        meta.sampleRate = (b[10] << 12) | (b[11] << 4) | (b[12] >> 4);
        meta.channels = ((b[12] >> 1) & 0x07) + 1;
        meta.bitDepth = (((b[12] & 0x01) << 4) | (b[13] >> 4)) + 1;
        const totalSamples = (b[13] & 0x0f) * 2 ** 32 + u32be(b, 14);
        if (meta.sampleRate && totalSamples) meta.duration = totalSamples / meta.sampleRate;
      } else if (type === 4) { // VORBIS_COMMENT
        const b = await readBytes(file, pos, len);
        applyVorbisComments(b, meta);
      } else if (type === 6 && !meta.picture) { // PICTURE
        const b = await readBytes(file, pos, len);
        let o = 4;
        const mimeLen = u32be(b, o); o += 4;
        const mime = ascii(b, o, mimeLen); o += mimeLen;
        const descLen = u32be(b, o); o += 4 + descLen;
        o += 16;
        const dataLen = u32be(b, o); o += 4;
        meta.picture = new Blob([b.subarray(o, o + dataLen)], { type: mime || 'image/jpeg' });
      }
      pos += len;
      if (last) break;
    }
    meta.codec = 'FLAC';
    meta.lossless = true;
  }

  function applyVorbisComments(b, meta) {
    let o = 0;
    const vendorLen = u32le(b, o); o += 4 + vendorLen;
    const count = u32le(b, o); o += 4;
    for (let i = 0; i < count && o < b.length; i++) {
      const len = u32le(b, o); o += 4;
      const s = utf8.decode(b.subarray(o, o + len)); o += len;
      const eq = s.indexOf('=');
      if (eq < 0) continue;
      const key = s.slice(0, eq).toUpperCase();
      const val = s.slice(eq + 1);
      switch (key) {
        case 'TITLE': meta.title = val; break;
        case 'ARTIST': meta.artist = meta.artist || val; break;
        case 'ALBUM': meta.album = val; break;
        case 'ALBUMARTIST': case 'ALBUM ARTIST': meta.albumArtist = val; break;
        case 'TRACKNUMBER': meta.track = parseNum(val); break;
        case 'DISCNUMBER': meta.disc = parseNum(val); break;
        case 'DATE': case 'YEAR': meta.year = meta.year || String(val).slice(0, 4); break;
        case 'GENRE': meta.genre = meta.genre || genreName(val); break;
        case 'REPLAYGAIN_TRACK_GAIN': meta.rgTrack = parseFloat(val); break;
        case 'REPLAYGAIN_ALBUM_GAIN': meta.rgAlbum = parseFloat(val); break;
        case 'REPLAYGAIN_TRACK_PEAK': meta.rgTrackPeak = parseFloat(val); break;
        case 'REPLAYGAIN_ALBUM_PEAK': meta.rgAlbumPeak = parseFloat(val); break;
      }
    }
  }

  // ---------- ID3v2 (MP3) ----------
  function decodeText(enc, bytes) {
    // 末尾の NUL を除去
    let end = bytes.length;
    if (enc === 1 || enc === 2) { while (end >= 2 && bytes[end - 1] === 0 && bytes[end - 2] === 0) end -= 2; }
    else { while (end >= 1 && bytes[end - 1] === 0) end -= 1; }
    const b = bytes.subarray(0, end);
    switch (enc) {
      case 0: return latin1.decode(b);
      case 1:
        if (b[0] === 0xfe && b[1] === 0xff) return utf16be.decode(b.subarray(2));
        if (b[0] === 0xff && b[1] === 0xfe) return utf16le.decode(b.subarray(2));
        return utf16le.decode(b);
      case 2: return utf16be.decode(b);
      default: return utf8.decode(b);
    }
  }

  function findTerminator(b, o, enc) {
    if (enc === 1 || enc === 2) {
      for (let i = o; i + 1 < b.length; i += 2) if (b[i] === 0 && b[i + 1] === 0) return i;
      return b.length;
    }
    for (let i = o; i < b.length; i++) if (b[i] === 0) return i;
    return b.length;
  }

  async function parseId3(file, meta) {
    const h = await readBytes(file, 0, 10);
    const ver = h[3];
    const flags = h[5];
    const size = syncsafe(h, 6);
    const b = await readBytes(file, 10, size);
    let o = 0;
    if (flags & 0x40) { // extended header
      o += ver === 4 ? syncsafe(b, 0) : u32be(b, 0) + 4;
    }
    while (o + 10 <= b.length && ver >= 3) {
      const id = ascii(b, o, 4);
      if (!/^[A-Z0-9]{4}$/.test(id)) break;
      const len = ver === 4 ? syncsafe(b, o + 4) : u32be(b, o + 4);
      const data = b.subarray(o + 10, o + 10 + len);
      o += 10 + len;
      if (!len) continue;
      const enc = data[0];
      const text = () => decodeText(enc, data.subarray(1));
      switch (id) {
        case 'TIT2': meta.title = text(); break;
        case 'TPE1': meta.artist = text(); break;
        case 'TALB': meta.album = text(); break;
        case 'TPE2': meta.albumArtist = text(); break;
        case 'TRCK': meta.track = parseNum(text()); break;
        case 'TPOS': meta.disc = parseNum(text()); break;
        case 'TDRC': case 'TYER': meta.year = text().slice(0, 4); break;
        case 'TCON': meta.genre = genreName(text()); break;
        case 'TXXX': { // ユーザー定義テキスト（ReplayGain はここに入る）
          const descEnd = findTerminator(data, 1, enc);
          const desc = decodeText(enc, data.subarray(1, descEnd)).toUpperCase();
          const val = parseFloat(decodeText(enc, data.subarray(descEnd + (enc === 1 || enc === 2 ? 2 : 1))));
          if (!Number.isFinite(val)) break;
          if (desc === 'REPLAYGAIN_TRACK_GAIN') meta.rgTrack = val;
          else if (desc === 'REPLAYGAIN_ALBUM_GAIN') meta.rgAlbum = val;
          else if (desc === 'REPLAYGAIN_TRACK_PEAK') meta.rgTrackPeak = val;
          else if (desc === 'REPLAYGAIN_ALBUM_PEAK') meta.rgAlbumPeak = val;
          break;
        }
        case 'APIC': {
          if (meta.picture) break;
          let p = 1;
          const mimeEnd = findTerminator(data, p, 0);
          let mime = latin1.decode(data.subarray(p, mimeEnd));
          p = mimeEnd + 1;
          p += 1; // picture type
          const descEnd = findTerminator(data, p, enc);
          p = descEnd + (enc === 1 || enc === 2 ? 2 : 1);
          if (!mime.includes('/')) mime = 'image/' + (mime.toLowerCase() === 'png' ? 'png' : 'jpeg');
          meta.picture = new Blob([data.subarray(p)], { type: mime });
          break;
        }
      }
    }
    return 10 + size + (flags & 0x10 ? 10 : 0);
  }

  const MPEG_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

  async function parseMp3(file, meta) {
    let audioStart = 0;
    const head = await readBytes(file, 0, 10);
    if (ascii(head, 0, 3) === 'ID3') audioStart = await parseId3(file, meta);
    const b = await readBytes(file, audioStart, 4096);
    for (let i = 0; i + 4 < b.length; i++) {
      if (b[i] === 0xff && (b[i + 1] & 0xe0) === 0xe0) {
        const version = (b[i + 1] >> 3) & 0x03;
        const rateIdx = (b[i + 2] >> 2) & 0x03;
        if (version === 1 || rateIdx === 3) continue;
        meta.sampleRate = MPEG_RATES[version][rateIdx];
        meta.channels = ((b[i + 3] >> 6) & 0x03) === 3 ? 1 : 2;
        break;
      }
    }
    meta.codec = 'MP3';
    meta.lossless = false;
  }

  // ---------- MP4 / M4A ----------
  async function parseMp4(file, meta) {
    let pos = 0;
    let moov = null;
    for (let guard = 0; guard < 64 && pos + 8 <= file.size; guard++) {
      const h = await readBytes(file, pos, 16);
      let size = u32be(h, 0);
      const type = ascii(h, 4, 4);
      let headerLen = 8;
      if (size === 1) { size = u32be(h, 8) * 2 ** 32 + u32be(h, 12); headerLen = 16; }
      else if (size === 0) size = file.size - pos;
      if (type === 'moov') { moov = await readBytes(file, pos + headerLen, size - headerLen); break; }
      if (size < 8) break;
      pos += size;
    }
    meta.codec = 'AAC';
    meta.lossless = false;
    if (!moov) return;

    const CONTAINERS = new Set(['trak', 'mdia', 'minf', 'stbl', 'udta', 'ilst']);
    const walk = (b, start, end, path) => {
      let o = start;
      while (o + 8 <= end) {
        const size = u32be(b, o);
        const type = ascii(b, o + 4, 4);
        if (size < 8 || o + size > end) break;
        const bodyStart = o + 8;
        const bodyEnd = o + size;
        if (CONTAINERS.has(type)) walk(b, bodyStart, bodyEnd, path + '/' + type);
        else if (type === 'meta') walk(b, bodyStart + 4, bodyEnd, path + '/meta');
        else if (type === 'mdhd') {
          const v = b[bodyStart];
          const ts = v === 1 ? u32be(b, bodyStart + 20) : u32be(b, bodyStart + 12);
          const dur = v === 1 ? u32be(b, bodyStart + 24) * 2 ** 32 + u32be(b, bodyStart + 28) : u32be(b, bodyStart + 16);
          if (ts && !meta.duration) meta.duration = dur / ts;
        } else if (type === 'stsd') {
          // stsd: version/flags(4) count(4) → sample entry
          const e = bodyStart + 8;
          const fmt = ascii(b, e + 4, 4);
          if (fmt === 'alac') { meta.codec = 'ALAC'; meta.lossless = true; }
          else if (fmt === 'mp4a') meta.codec = 'AAC';
          // AudioSampleEntry: +8 reserved/ref, +8 reserved, channels(2) sampleSize(2) ... sampleRate(16.16) at +32
          meta.channels = u16be(b, e + 24);
          meta.bitDepth = u16be(b, e + 26);
          meta.sampleRate = u16be(b, e + 32);
          if (fmt === 'alac') {
            // alac 固有ボックスに正確な値がある
            const a = e + 36;
            if (ascii(b, a + 4, 4) === 'alac') {
              meta.bitDepth = b[a + 12 + 5];
              meta.channels = b[a + 12 + 9];
              meta.sampleRate = u32be(b, a + 12 + 20);
            }
          }
          if (meta.codec === 'AAC') meta.bitDepth = null;
        } else if (path.endsWith('/ilst')) {
          // ilst の子: 中の 'data' ボックスに値がある
          const d = bodyStart;
          if (ascii(b, d + 4, 4) === 'data') {
            const dsize = u32be(b, d);
            const vstart = d + 16;
            const val = b.subarray(vstart, d + dsize);
            const str = () => utf8.decode(val);
            switch (type) {
              case '©nam': meta.title = str(); break;
              case '©ART': meta.artist = str(); break;
              case '©alb': meta.album = str(); break;
              case 'aART': meta.albumArtist = str(); break;
              case '©day': meta.year = str().slice(0, 4); break;
              case '©gen': meta.genre = str(); break;
              case 'gnre': meta.genre = meta.genre || ID3_GENRES[u16be(val, 0) - 1] || null; break;
              case 'trkn': meta.track = u16be(val, 2) || null; break;
              case 'disk': meta.disc = u16be(val, 2) || null; break;
              case 'covr': {
                const t = u32be(b, d + 8) & 0xffffff;
                meta.picture = new Blob([val], { type: t === 14 ? 'image/png' : 'image/jpeg' });
                break;
              }
            }
          }
        }
        o += size;
      }
    };
    walk(moov, 0, moov.length, '/moov');
  }

  // ---------- WAV ----------
  async function parseWav(file, meta) {
    let pos = 12;
    for (let guard = 0; guard < 64 && pos + 8 <= file.size; guard++) {
      const h = await readBytes(file, pos, 8);
      const id = ascii(h, 0, 4);
      const size = u32le(h, 4);
      if (id === 'fmt ') {
        const b = await readBytes(file, pos + 8, Math.min(size, 40));
        meta.channels = u16le(b, 2);
        meta.sampleRate = u32le(b, 4);
        const byteRate = u32le(b, 8);
        meta.bitDepth = u16le(b, 14);
        meta._byteRate = byteRate;
      } else if (id === 'data') {
        if (meta._byteRate) meta.duration = size / meta._byteRate;
      } else if (id === 'LIST') {
        const b = await readBytes(file, pos + 8, size);
        if (ascii(b, 0, 4) === 'INFO') {
          let o = 4;
          while (o + 8 <= b.length) {
            const sid = ascii(b, o, 4);
            const slen = u32le(b, o + 4);
            const val = utf8.decode(b.subarray(o + 8, o + 8 + slen)).replace(/\0+$/, '');
            if (sid === 'INAM') meta.title = val;
            else if (sid === 'IART') meta.artist = val;
            else if (sid === 'IPRD') meta.album = val;
            else if (sid === 'ITRK') meta.track = parseNum(val);
            else if (sid === 'ICRD') meta.year = val.slice(0, 4);
            else if (sid === 'IGNR') meta.genre = genreName(val);
            o += 8 + slen + (slen & 1);
          }
        }
      }
      pos += 8 + size + (size & 1);
    }
    delete meta._byteRate;
    meta.codec = 'WAV';
    meta.lossless = true;
  }

  // ---------- 入口 ----------
  async function parse(file) {
    const path = file.webkitRelativePath || file.name;
    const parts = path.split('/');
    const fileName = parts[parts.length - 1];
    const meta = {
      path,
      dir: parts.slice(0, -1).join('/'),
      title: null, artist: null, album: null, albumArtist: null,
      track: null, disc: null, year: null, genre: null,
      sampleRate: null, bitDepth: null, channels: null, duration: null,
      codec: ext(fileName).toUpperCase(), lossless: null, picture: null,
    };
    try {
      const head = await readBytes(file, 0, 12);
      const magic = ascii(head, 0, 4);
      if (magic === 'fLaC') await parseFlac(file, meta);
      else if (magic === 'RIFF' && ascii(head, 8, 4) === 'WAVE') await parseWav(file, meta);
      else if (ascii(head, 4, 4) === 'ftyp') await parseMp4(file, meta);
      else if (ascii(head, 0, 3) === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0)) await parseMp3(file, meta);
    } catch (e) {
      console.warn('タグ解析に失敗:', path, e);
    }
    // タグが無い場合はファイル名・フォルダー名から推定
    if (!meta.title) {
      const base = fileName.replace(/\.[^.]+$/, '');
      const m = base.match(/^(\d{1,3})[\s.\-_]+(.*)$/);
      if (m) { meta.title = m[2]; if (meta.track == null) meta.track = parseInt(m[1], 10); }
      else meta.title = base;
    }
    if (!meta.album) meta.album = parts.length >= 2 ? parts[parts.length - 2] : '不明なアルバム';
    if (!meta.genre) meta.genre = '不明なジャンル';
    if (!meta.artist) meta.artist = parts.length >= 3 ? parts[parts.length - 3] : '不明なアーティスト';
    return meta;
  }

  MP.metadata = {
    parse,
    isAudio: (name) => AUDIO_EXT.includes(ext(name)),
    isImage: (name) => IMAGE_EXT.includes(ext(name)),
    ext,
  };
})(window.MP = window.MP || {});

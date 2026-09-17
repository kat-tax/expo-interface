#include "pch.h"

#include "Common.h"
#include "Media.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::Foundation::Collections;
using namespace winrt::Windows::Devices::Enumeration;
using namespace winrt::Windows::Graphics::Imaging;
using namespace winrt::Windows::Media;
using namespace winrt::Windows::Media::Capture;
using namespace winrt::Windows::Media::Core;
using namespace winrt::Windows::Media::Editing;
using namespace winrt::Windows::Media::MediaProperties;
using namespace winrt::Windows::Media::Playback;
using namespace winrt::Windows::Media::SpeechSynthesis;
using namespace winrt::Windows::Storage;
using namespace winrt::Windows::Storage::Streams;
using namespace ExpoWindows;

namespace fs = std::filesystem;

namespace {

std::mutex g_playersLock;
std::map<int32_t, MediaPlayer> g_players;
int32_t g_nextPlayer = 1;

double Seconds(TimeSpan const &span) {
  return std::chrono::duration<double>(span).count();
}

TimeSpan FromSeconds(double seconds) {
  return std::chrono::duration_cast<TimeSpan>(std::chrono::duration<double>(std::max(0.0, seconds)));
}

std::string UriOf(fs::path const &path) {
  std::string generic = ToUtf8(path.generic_wstring());
  std::string out = "file:///";
  for (unsigned char c : generic) {
    if (std::isalnum(c) || c == '/' || c == ':' || c == '-' || c == '_' || c == '.' || c == '~') out += static_cast<char>(c);
    else {
      char escaped[4];
      std::snprintf(escaped, sizeof(escaped), "%%%02X", c);
      out += escaped;
    }
  }
  return out;
}

/** `%LOCALAPPDATA%\<the exe's name>\cache\<folder>`, created. */
fs::path CacheFolder(wchar_t const *folder) {
  PWSTR local = nullptr;
  check_hresult(SHGetKnownFolderPath(FOLDERID_LocalAppData, 0, nullptr, &local));
  fs::path directory(local);
  CoTaskMemFree(local);
  wchar_t exe[MAX_PATH]{};
  GetModuleFileNameW(nullptr, exe, MAX_PATH);
  auto path = directory / fs::path(exe).stem() / L"cache" / folder;
  std::error_code error;
  fs::create_directories(path, error);
  return path;
}

std::wstring NewName(wchar_t const *extension) {
  GUID guid{};
  CoCreateGuid(&guid);
  wchar_t text[64]{};
  StringFromGUID2(guid, text, 64);
  return std::wstring(text + 1, wcslen(text) - 2) + extension;
}

/** The source a URI names: a file on disk, or anything the media pipeline streams. */
MediaSource SourceFor(std::string const &uri) {
  return MediaSource::CreateFromUri(Uri(ToWide(uri)));
}

/** The file a video URI names, fetched into the cache when it is remote. */
IAsyncOperation<StorageFile> VideoFileFor(std::string uri) {
  std::wstring path = PathFromUri(uri);
  if (!path.empty()) co_return co_await StorageFile::GetFileFromPathAsync(path);
  winrt::Windows::Web::Http::HttpClient client;
  auto buffer = co_await client.GetBufferAsync(Uri(ToWide(uri)));
  auto target = CacheFolder(L"VideoThumbnails") / NewName(L".mp4");
  auto folder = co_await StorageFolder::GetFolderFromPathAsync(target.parent_path().c_str());
  auto file = co_await folder.CreateFileAsync(target.filename().c_str(), CreationCollisionOption::ReplaceExisting);
  co_await FileIO::WriteBufferAsync(file, buffer);
  co_return file;
}

/** The encoding profile for a recording's extension: m4a (AAC), mp3, wav, wma. */
MediaEncodingProfile ProfileFor(std::wstring const &extension) {
  std::wstring lower = extension;
  std::transform(lower.begin(), lower.end(), lower.begin(), ::towlower);
  if (lower == L".mp3") return MediaEncodingProfile::CreateMp3(AudioEncodingQuality::High);
  if (lower == L".wav") return MediaEncodingProfile::CreateWav(AudioEncodingQuality::High);
  if (lower == L".wma") return MediaEncodingProfile::CreateWma(AudioEncodingQuality::High);
  return MediaEncodingProfile::CreateM4a(AudioEncodingQuality::High);
}

struct Recorder {
  MediaCapture capture{nullptr};
  StorageFile file{nullptr};
  bool recording{false};
  bool prepared{false};
  std::chrono::steady_clock::time_point since{};
  std::chrono::milliseconds elapsed{0};
  std::string url;

  double DurationMillis() const {
    auto total = elapsed;
    if (recording) total += std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - since);
    return static_cast<double>(total.count());
  }
};

struct Utterance {
  std::string id;
  std::string text;
  std::string language;
  std::string voice;
  double pitch{1};
  double rate{1};
  double volume{1};
};

} // namespace

namespace ExpoWindows::Media {

MediaPlayer PlayerFor(int32_t id) noexcept {
  std::lock_guard lock(g_playersLock);
  auto found = g_players.find(id);
  return found == g_players.end() ? MediaPlayer{nullptr} : found->second;
}

} // namespace ExpoWindows::Media

/**
 * `ExpoWindowsMedia`: the media engine behind `expo-video`, `expo-audio`,
 * `expo-video-thumbnails` and `expo-speech` — `Windows.Media.Playback`
 * players by id (the video view shows one by that id), the shell's
 * transport controls for the now-playing metadata, thumbnails from
 * `Windows.Media.Editing`, an audio recorder over `MediaCapture`, and
 * speech through `SpeechSynthesizer` played by a player of its own.
 */
REACT_MODULE(ExpoWindowsMedia)
struct ExpoWindowsMedia {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  /** What a player reports: `{id, event: 'state' | 'opened' | 'ended' | 'failed', ...}`. */
  REACT_EVENT(OnMediaEvent, L"onMediaEvent")
  std::function<void(JSValue)> OnMediaEvent;

  /** What an utterance reports: `{id, event: 'started' | 'done' | 'stopped' | 'error', error?}`. */
  REACT_EVENT(OnSpeechEvent, L"onSpeechEvent")
  std::function<void(JSValue)> OnSpeechEvent;

  // Players

  /** A new player, on the source when one is given; its id. */
  REACT_SYNC_METHOD(CreatePlayer, L"createPlayer")
  int32_t CreatePlayer(std::string uri) noexcept {
    try {
      MediaPlayer player;
      player.AutoPlay(false);
      player.CommandManager().IsEnabled(false);
      int32_t id;
      {
        std::lock_guard lock(g_playersLock);
        id = g_nextPlayer++;
        g_players.emplace(id, player);
      }
      player.MediaOpened([this, id](MediaPlayer const &sender, winrt::Windows::Foundation::IInspectable const &) {
        Emit(JSValueObject{{"id", id}, {"event", "opened"}, {"duration", Seconds(sender.PlaybackSession().NaturalDuration())}});
      });
      player.MediaEnded([this, id](MediaPlayer const &, winrt::Windows::Foundation::IInspectable const &) {
        Emit(JSValueObject{{"id", id}, {"event", "ended"}});
      });
      player.MediaFailed([this, id](MediaPlayer const &, MediaPlayerFailedEventArgs const &args) {
        Emit(JSValueObject{{"id", id}, {"event", "failed"}, {"error", to_string(args.ErrorMessage())}});
      });
      player.PlaybackSession().PlaybackStateChanged([this, id](MediaPlaybackSession const &session, winrt::Windows::Foundation::IInspectable const &) {
        auto state = session.PlaybackState();
        Emit(JSValueObject{{"id", id}, {"event", "state"}, {"playing", state == MediaPlaybackState::Playing}, {"buffering", state == MediaPlaybackState::Buffering || state == MediaPlaybackState::Opening}});
      });
      if (!uri.empty()) player.Source(SourceFor(uri));
      return id;
    } catch (hresult_error const &) {
      return 0;
    }
  }

  REACT_SYNC_METHOD(ReleasePlayer, L"releasePlayer")
  bool ReleasePlayer(int32_t id) noexcept {
    MediaPlayer player{nullptr};
    {
      std::lock_guard lock(g_playersLock);
      auto found = g_players.find(id);
      if (found == g_players.end()) return false;
      player = found->second;
      g_players.erase(found);
    }
    try {
      player.Pause();
      player.Source(nullptr);
      player.Close();
    } catch (hresult_error const &) {
    }
    return true;
  }

  /** The player's source replaced; '' clears it. */
  REACT_SYNC_METHOD(SetSource, L"setSource")
  bool SetSource(int32_t id, std::string uri) noexcept {
    auto player = ExpoWindows::Media::PlayerFor(id);
    if (!player) return false;
    try {
      if (uri.empty()) player.Source(nullptr);
      else player.Source(SourceFor(uri));
      return true;
    } catch (hresult_error const &) {
      return false;
    }
  }

  /** One of play, pause, seek (seconds), seekBy (seconds), replay, loop, muted, volume, rate — `value` as the action takes it. */
  REACT_SYNC_METHOD(Control, L"control")
  bool Control(int32_t id, std::string action, double value) noexcept {
    auto player = ExpoWindows::Media::PlayerFor(id);
    if (!player) return false;
    try {
      auto session = player.PlaybackSession();
      if (action == "play") player.Play();
      else if (action == "pause") player.Pause();
      else if (action == "seek") session.Position(FromSeconds(value));
      else if (action == "seekBy") session.Position(FromSeconds(Seconds(session.Position()) + value));
      else if (action == "replay") {
        session.Position(FromSeconds(0));
        player.Play();
      } else if (action == "loop") player.IsLoopingEnabled(value != 0);
      else if (action == "muted") player.IsMuted(value != 0);
      else if (action == "volume") player.Volume(std::clamp(value, 0.0, 1.0));
      else if (action == "rate") session.PlaybackRate(value);
      else return false;
      return true;
    } catch (hresult_error const &) {
      return false;
    }
  }

  /** The player's state, as the JavaScript player reads its properties from. */
  REACT_SYNC_METHOD(PlayerState, L"playerState")
  JSValue PlayerState(int32_t id) noexcept {
    auto player = ExpoWindows::Media::PlayerFor(id);
    if (!player) return JSValue{nullptr};
    try {
      auto session = player.PlaybackSession();
      auto state = session.PlaybackState();
      bool hasSource = player.Source() != nullptr;
      std::string status = !hasSource ? "idle" : state == MediaPlaybackState::Opening || state == MediaPlaybackState::Buffering ? "loading" : state == MediaPlaybackState::None ? "loading" : "readyToPlay";
      double duration = Seconds(session.NaturalDuration());
      double position = Seconds(session.Position());
      return JSValue(JSValueObject{
          {"playing", state == MediaPlaybackState::Playing},
          {"buffering", state == MediaPlaybackState::Buffering || state == MediaPlaybackState::Opening},
          {"currentTime", position},
          {"duration", duration},
          {"bufferedPosition", session.CanSeek() ? std::min(duration, position + session.BufferingProgress() * duration) : position},
          {"volume", player.Volume()},
          {"muted", player.IsMuted()},
          {"loop", player.IsLoopingEnabled()},
          {"playbackRate", session.PlaybackRate()},
          {"status", status},
          {"loaded", hasSource && state != MediaPlaybackState::None && state != MediaPlaybackState::Opening},
          {"isLive", hasSource && session.NaturalDuration().count() == 0 && state != MediaPlaybackState::None && state != MediaPlaybackState::Opening},
      });
    } catch (hresult_error const &error) {
      return JSValue(JSValueObject{{"status", "error"}, {"error", Message(error)}});
    }
  }

  /** The shell's transport controls for a player: on with the title, artist and album, or off. */
  REACT_SYNC_METHOD(SetNowPlaying, L"setNowPlaying")
  bool SetNowPlaying(int32_t id, bool active, JSValue metadata) noexcept {
    auto player = ExpoWindows::Media::PlayerFor(id);
    if (!player) return false;
    try {
      player.CommandManager().IsEnabled(active);
      auto controls = player.SystemMediaTransportControls();
      controls.IsEnabled(active);
      if (active && metadata.Type() == JSValueType::Object) {
        auto const &object = metadata.AsObject();
        auto updater = controls.DisplayUpdater();
        updater.Type(MediaPlaybackType::Music);
        auto music = updater.MusicProperties();
        auto text = [&](char const *key) { return object.find(key) != object.end() && object.at(key).Type() == JSValueType::String ? to_hstring(object.at(key).AsString()) : hstring{}; };
        music.Title(text("title"));
        music.Artist(text("artist"));
        music.AlbumTitle(text("albumTitle"));
        if (auto artwork = text("artworkUrl"); !artwork.empty()) updater.Thumbnail(RandomAccessStreamReference::CreateFromUri(Uri(artwork)));
        updater.Update();
      } else if (!active) {
        controls.DisplayUpdater().ClearAll();
      }
      return true;
    } catch (hresult_error const &) {
      return false;
    }
  }

  // Thumbnails

  /** A frame of the video at `timeMs`, no larger than the bounds, encoded as JPEG at `quality` (PNG at 1) into the cache. */
  REACT_METHOD(Thumbnail, L"thumbnail")
  fire_and_forget Thumbnail(std::string uri, double timeMs, double maxWidth, double maxHeight, double quality, ReactPromise<JSValue> promise) noexcept {
    try {
      auto file = co_await VideoFileFor(uri);
      auto clip = co_await MediaClip::CreateFromFileAsync(file);
      MediaComposition composition;
      composition.Clips().Append(clip);
      auto encoding = clip.GetVideoEncodingProperties();
      double width = encoding.Width(), height = encoding.Height();
      if (width <= 0 || height <= 0) throw hresult_error(E_FAIL, L"The file has no video");
      double scale = 1;
      if (maxWidth > 0) scale = std::min(scale, maxWidth / width);
      if (maxHeight > 0) scale = std::min(scale, maxHeight / height);
      int32_t outWidth = std::max(1, static_cast<int32_t>(std::lround(width * scale)));
      int32_t outHeight = std::max(1, static_cast<int32_t>(std::lround(height * scale)));
      auto duration = Seconds(clip.OriginalDuration());
      double time = std::clamp(timeMs / 1000.0, 0.0, std::max(0.0, duration));
      auto frame = co_await composition.GetThumbnailAsync(FromSeconds(time), outWidth, outHeight, VideoFramePrecision::NearestFrame);
      auto decoder = co_await BitmapDecoder::CreateAsync(frame);
      auto bitmap = co_await decoder.GetSoftwareBitmapAsync(BitmapPixelFormat::Bgra8, BitmapAlphaMode::Premultiplied);
      bool png = quality >= 1;
      auto target = CacheFolder(L"VideoThumbnails") / NewName(png ? L".png" : L".jpg");
      auto output = co_await FileRandomAccessStream::OpenAsync(target.c_str(), FileAccessMode::ReadWrite, StorageOpenOptions::None, FileOpenDisposition::CreateAlways);
      BitmapPropertySet properties;
      if (!png) properties.Insert(L"ImageQuality", BitmapTypedValue(box_value(static_cast<float>(std::clamp(quality, 0.0, 1.0))), PropertyType::Single));
      auto encoder = co_await BitmapEncoder::CreateAsync(png ? BitmapEncoder::PngEncoderId() : BitmapEncoder::JpegEncoderId(), output, properties);
      encoder.SetSoftwareBitmap(bitmap);
      co_await encoder.FlushAsync();
      output.Close();
      promise.Resolve(JSValueObject{{"uri", UriOf(target)}, {"width", bitmap.PixelWidth()}, {"height", bitmap.PixelHeight()}, {"actualTime", time * 1000}});
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  // Speech

  REACT_METHOD(Speak, L"speak")
  void Speak(std::string id, std::string text, JSValue options) noexcept {
    Utterance utterance{std::move(id), std::move(text)};
    if (options.Type() == JSValueType::Object) {
      auto const &object = options.AsObject();
      auto has = [&](char const *key, JSValueType type) { return object.find(key) != object.end() && object.at(key).Type() == type; };
      if (has("language", JSValueType::String)) utterance.language = object.at("language").AsString();
      if (has("voice", JSValueType::String)) utterance.voice = object.at("voice").AsString();
      if (has("pitch", JSValueType::Double) || has("pitch", JSValueType::Int64)) utterance.pitch = object.at("pitch").AsDouble();
      if (has("rate", JSValueType::Double) || has("rate", JSValueType::Int64)) utterance.rate = object.at("rate").AsDouble();
      if (has("volume", JSValueType::Double) || has("volume", JSValueType::Int64)) utterance.volume = object.at("volume").AsDouble();
    }
    bool idle;
    {
      std::lock_guard lock(m_speechLock);
      m_queue.push_back(std::move(utterance));
      idle = !m_speaking;
      if (idle) m_speaking = true;
    }
    if (idle) SpeakNext();
  }

  /** stop (the current and the queue), pause, resume. */
  REACT_SYNC_METHOD(SpeechControl, L"speechControl")
  bool SpeechControl(std::string action) noexcept {
    try {
      if (action == "pause") {
        if (m_speechPlayer && m_speaking) m_speechPlayer.Pause();
        return true;
      }
      if (action == "resume") {
        if (m_speechPlayer && m_speaking) m_speechPlayer.Play();
        return true;
      }
      if (action != "stop") return false;
      std::vector<std::string> stopped;
      {
        std::lock_guard lock(m_speechLock);
        if (!m_speaking) return true;
        if (!m_current.empty()) stopped.push_back(m_current);
        for (auto const &queued : m_queue) stopped.push_back(queued.id);
        m_queue.clear();
        m_current.clear();
        m_speaking = false;
        ++m_generation;
      }
      if (m_speechPlayer) {
        m_speechPlayer.Pause();
        m_speechPlayer.Source(nullptr);
      }
      for (auto const &id : stopped) EmitSpeech(id, "stopped", "");
      return true;
    } catch (hresult_error const &) {
      return false;
    }
  }

  /** Whether an utterance is being said or waits to be, paused included. */
  REACT_SYNC_METHOD(IsSpeaking, L"isSpeaking")
  bool IsSpeaking() noexcept {
    std::lock_guard lock(m_speechLock);
    return m_speaking;
  }

  REACT_METHOD(Voices, L"voices")
  void Voices(ReactPromise<JSValue> promise) noexcept {
    try {
      JSValueArray voices;
      for (auto const &voice : SpeechSynthesizer::AllVoices()) {
        voices.push_back(JSValueObject{{"identifier", to_string(voice.Id())}, {"name", to_string(voice.DisplayName())}, {"quality", "Default"}, {"language", to_string(voice.Language())}});
      }
      promise.Resolve(JSValue(std::move(voices)));
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  // Recording

  /** The recorder made ready on the input asked for (or the default), to record into the file at `path`. */
  REACT_METHOD(PrepareRecorder, L"prepareRecorder")
  fire_and_forget PrepareRecorder(int32_t id, std::string path, std::string inputId, ReactPromise<bool> promise) noexcept {
    try {
      auto recorder = std::make_shared<Recorder>();
      MediaCaptureInitializationSettings settings;
      settings.StreamingCaptureMode(StreamingCaptureMode::Audio);
      settings.MediaCategory(MediaCategory::Speech);
      if (!inputId.empty()) settings.AudioDeviceId(to_hstring(inputId));
      recorder->capture = MediaCapture{};
      co_await recorder->capture.InitializeAsync(settings);
      std::wstring native = path.rfind("file:", 0) == 0 ? PathFromUri(path) : ToWide(path);
      if (native.empty()) throw hresult_invalid_argument(L"Not a file path: " + to_hstring(path));
      fs::path target(native);
      std::error_code error;
      fs::create_directories(target.parent_path(), error);
      auto folder = co_await StorageFolder::GetFolderFromPathAsync(target.parent_path().c_str());
      recorder->file = co_await folder.CreateFileAsync(target.filename().c_str(), CreationCollisionOption::ReplaceExisting);
      recorder->prepared = true;
      recorder->url = UriOf(target);
      {
        std::lock_guard lock(m_recordersLock);
        m_recorders[id] = recorder;
      }
      promise.Resolve(true);
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** record, pause, resume, stop — stop answers with the file's URI. */
  REACT_METHOD(RecorderControl, L"recorderControl")
  fire_and_forget RecorderControl(int32_t id, std::string action, ReactPromise<JSValue> promise) noexcept {
    try {
      auto recorder = RecorderFor(id);
      if (!recorder || !recorder->prepared) throw hresult_error(E_FAIL, L"The recorder is not prepared: call prepareToRecordAsync first");
      if (action == "record") {
        if (!recorder->recording) {
          if (recorder->elapsed.count() == 0) {
            co_await recorder->capture.StartRecordToStorageFileAsync(ProfileFor(recorder->file.FileType().c_str()), recorder->file);
          } else {
            co_await recorder->capture.ResumeRecordAsync();
          }
          recorder->since = std::chrono::steady_clock::now();
          recorder->recording = true;
        }
      } else if (action == "pause") {
        if (recorder->recording) {
          co_await recorder->capture.PauseRecordAsync(winrt::Windows::Media::Devices::MediaCapturePauseBehavior::RetainHardwareResources);
          recorder->elapsed += std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - recorder->since);
          recorder->recording = false;
        }
      } else if (action == "stop") {
        if (recorder->recording || recorder->elapsed.count() > 0) {
          if (recorder->recording) recorder->elapsed += std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - recorder->since);
          recorder->recording = false;
          co_await recorder->capture.StopRecordAsync();
        }
        recorder->prepared = false;
      } else {
        throw hresult_invalid_argument(L"Unknown recorder action");
      }
      promise.Resolve(JSValueObject{{"url", recorder->url}, {"durationMillis", recorder->DurationMillis()}});
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_SYNC_METHOD(RecorderState, L"recorderState")
  JSValue RecorderState(int32_t id) noexcept {
    auto recorder = RecorderFor(id);
    if (!recorder) return JSValue(JSValueObject{{"canRecord", false}, {"isRecording", false}, {"durationMillis", 0}, {"url", nullptr}});
    return JSValue(JSValueObject{{"canRecord", recorder->prepared}, {"isRecording", recorder->recording}, {"durationMillis", recorder->DurationMillis()}, {"url", recorder->url.empty() ? JSValue{nullptr} : JSValue(recorder->url)}});
  }

  REACT_SYNC_METHOD(ReleaseRecorder, L"releaseRecorder")
  bool ReleaseRecorder(int32_t id) noexcept {
    std::shared_ptr<Recorder> recorder;
    {
      std::lock_guard lock(m_recordersLock);
      auto found = m_recorders.find(id);
      if (found == m_recorders.end()) return false;
      recorder = found->second;
      m_recorders.erase(found);
    }
    try {
      if (recorder->recording) recorder->capture.StopRecordAsync();
      recorder->capture.Close();
    } catch (hresult_error const &) {
    }
    return true;
  }

  /** The audio capture devices: `{name, type, uid}` each. */
  REACT_METHOD(RecordingInputs, L"recordingInputs")
  fire_and_forget RecordingInputs(ReactPromise<JSValue> promise) noexcept {
    try {
      JSValueArray inputs;
      auto devices = co_await DeviceInformation::FindAllAsync(DeviceClass::AudioCapture);
      for (auto const &device : devices) {
        inputs.push_back(JSValueObject{{"name", to_string(device.Name())}, {"type", "Microphone"}, {"uid", to_string(device.Id())}});
      }
      promise.Resolve(JSValue(std::move(inputs)));
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

 private:
  void Emit(JSValueObject event) noexcept {
    if (OnMediaEvent) OnMediaEvent(JSValue(std::move(event)));
  }

  void EmitSpeech(std::string const &id, char const *event, std::string const &error) noexcept {
    if (!OnSpeechEvent) return;
    JSValueObject payload{{"id", id}, {"event", event}};
    if (!error.empty()) payload["error"] = error;
    OnSpeechEvent(JSValue(std::move(payload)));
  }

  std::shared_ptr<Recorder> RecorderFor(int32_t id) noexcept {
    std::lock_guard lock(m_recordersLock);
    auto found = m_recorders.find(id);
    return found == m_recorders.end() ? nullptr : found->second;
  }

  /** The speech player, made once: its ending or failing moves the queue on. */
  MediaPlayer SpeechPlayer() {
    if (!m_speechPlayer) {
      m_speechPlayer = MediaPlayer{};
      m_speechPlayer.CommandManager().IsEnabled(false);
      m_speechPlayer.AutoPlay(true);
      m_speechPlayer.MediaEnded([this](MediaPlayer const &, winrt::Windows::Foundation::IInspectable const &) { Finished("done", ""); });
      m_speechPlayer.MediaFailed([this](MediaPlayer const &, MediaPlayerFailedEventArgs const &args) { Finished("error", to_string(args.ErrorMessage())); });
    }
    return m_speechPlayer;
  }

  /** The current utterance is over: told, and the next one started. */
  void Finished(char const *event, std::string const &error) noexcept {
    std::string id;
    {
      std::lock_guard lock(m_speechLock);
      id = m_current;
      m_current.clear();
    }
    if (!id.empty()) EmitSpeech(id, event, error);
    SpeakNext();
  }

  /** Synthesizes the next utterance in the queue and plays it; idles when there is none. */
  fire_and_forget SpeakNext() noexcept {
    Utterance utterance;
    uint32_t generation;
    {
      std::lock_guard lock(m_speechLock);
      if (m_queue.empty()) {
        m_speaking = false;
        co_return;
      }
      utterance = std::move(m_queue.front());
      m_queue.pop_front();
      m_current = utterance.id;
      m_speaking = true;
      generation = m_generation;
    }
    try {
      SpeechSynthesizer synthesizer;
      if (!utterance.voice.empty() || !utterance.language.empty()) {
        for (auto const &voice : SpeechSynthesizer::AllVoices()) {
          bool byId = !utterance.voice.empty() && to_string(voice.Id()) == utterance.voice;
          bool byLanguage = utterance.voice.empty() && _wcsnicmp(voice.Language().c_str(), ToWide(utterance.language).c_str(), utterance.language.size()) == 0;
          if (byId || byLanguage) {
            synthesizer.Voice(voice);
            break;
          }
        }
      }
      synthesizer.Options().AudioPitch(std::clamp(utterance.pitch, 0.0, 2.0));
      synthesizer.Options().SpeakingRate(std::clamp(utterance.rate, 0.5, 6.0));
      synthesizer.Options().AudioVolume(std::clamp(utterance.volume, 0.0, 1.0));
      auto stream = co_await synthesizer.SynthesizeTextToStreamAsync(to_hstring(utterance.text));
      {
        std::lock_guard lock(m_speechLock);
        if (generation != m_generation) co_return; // stopped meanwhile
      }
      auto player = SpeechPlayer();
      player.Source(MediaSource::CreateFromStream(stream, stream.ContentType()));
      player.Play();
      EmitSpeech(utterance.id, "started", "");
    } catch (hresult_error const &error) {
      Finished("error", Message(error));
    }
  }

  ReactContext m_context;
  std::mutex m_recordersLock;
  std::map<int32_t, std::shared_ptr<Recorder>> m_recorders;
  std::mutex m_speechLock;
  std::deque<Utterance> m_queue;
  std::string m_current;
  bool m_speaking{false};
  uint32_t m_generation{0};
  MediaPlayer m_speechPlayer{nullptr};
};

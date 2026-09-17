#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::Security::Cryptography;
using namespace winrt::Windows::Security::Cryptography::Core;
using namespace winrt::Windows::Storage;
using namespace winrt::Windows::Storage::Pickers;
using namespace winrt::Windows::Storage::Streams;
using namespace winrt::Windows::Web::Http;
using namespace ExpoWindows;

namespace fs = std::filesystem;

namespace {

// -- Paths and URIs ------------------------------------------------------------

/** The path a `file:` URI (or a plain path) names; empty for anything else. */
fs::path PathOf(std::string const &uri) {
  std::wstring path = PathFromUri(uri);
  if (path.empty()) throw hresult_invalid_argument(L"Not a file path: " + to_hstring(uri));
  return fs::path(path);
}

/** `file:///C:/…` with forward slashes, the characters a URI cannot carry percent-encoded, and a trailing slash for a directory. */
std::string UriOf(fs::path const &path, bool directory) {
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
  if (directory && out.back() != '/') out += '/';
  return out;
}

fs::path ExeDirectory() {
  wchar_t exe[MAX_PATH]{};
  GetModuleFileNameW(nullptr, exe, MAX_PATH);
  return fs::path(exe).parent_path();
}

double Milliseconds(FILETIME const &time) {
  ULARGE_INTEGER value{time.dwLowDateTime, time.dwHighDateTime};
  // 100-nanosecond intervals since 1601 to milliseconds since 1970.
  return static_cast<double>((value.QuadPart - 116444736000000000ULL) / 10000ULL);
}

struct Times {
  double modified{0};
  double created{0};
};

Times TimesOf(fs::path const &path) {
  WIN32_FILE_ATTRIBUTE_DATA data{};
  if (!GetFileAttributesExW(path.c_str(), GetFileExInfoStandard, &data)) return {};
  return {Milliseconds(data.ftLastWriteTime), Milliseconds(data.ftCreationTime)};
}

uint64_t DirectorySize(fs::path const &path) {
  uint64_t total = 0;
  std::error_code error;
  for (auto const &entry : fs::recursive_directory_iterator(path, fs::directory_options::skip_permission_denied, error)) {
    if (entry.is_regular_file(error)) total += entry.file_size(error);
  }
  return total;
}

// -- Bytes ---------------------------------------------------------------------

std::string ReadBytes(fs::path const &path) {
  std::ifstream stream(path, std::ios::binary);
  if (!stream) throw hresult_error(E_FAIL, L"The file could not be read: " + path.wstring());
  return std::string(std::istreambuf_iterator<char>(stream), {});
}

void WriteBytes(fs::path const &path, std::string const &bytes, bool append) {
  std::ofstream stream(path, std::ios::binary | (append ? std::ios::app : std::ios::trunc));
  if (!stream) throw hresult_error(E_FAIL, L"The file could not be written: " + path.wstring());
  stream.write(bytes.data(), static_cast<std::streamsize>(bytes.size()));
  if (!stream) throw hresult_error(E_FAIL, L"The file could not be written: " + path.wstring());
}

std::string ToBase64(std::string const &bytes) {
  return to_string(CryptographicBuffer::EncodeToBase64String(CryptographicBuffer::CreateFromByteArray(
      array_view<uint8_t const>(reinterpret_cast<uint8_t const *>(bytes.data()), reinterpret_cast<uint8_t const *>(bytes.data() + bytes.size())))));
}

std::string FromBase64(std::string const &base64) {
  if (base64.empty()) return {};
  auto buffer = CryptographicBuffer::DecodeFromBase64String(to_hstring(base64));
  com_array<uint8_t> bytes;
  CryptographicBuffer::CopyToByteArray(buffer, bytes);
  return std::string(reinterpret_cast<char const *>(bytes.data()), bytes.size());
}

std::string Md5(std::string const &bytes) {
  auto buffer = CryptographicBuffer::CreateFromByteArray(
      array_view<uint8_t const>(reinterpret_cast<uint8_t const *>(bytes.data()), reinterpret_cast<uint8_t const *>(bytes.data() + bytes.size())));
  return to_string(CryptographicBuffer::EncodeToHexString(HashAlgorithmProvider::OpenAlgorithm(HashAlgorithmNames::Md5()).HashData(buffer)));
}

/** The MIME type the system registers for the file's extension, or nothing. */
std::string MimeType(fs::path const &path) {
  std::wstring extension = path.extension().wstring();
  if (extension.empty()) return {};
  wchar_t buffer[256]{};
  DWORD size = 256;
  if (AssocQueryStringW(ASSOCF_NONE, ASSOCSTR_CONTENTTYPE, extension.c_str(), nullptr, buffer, &size) != S_OK) return {};
  return ToUtf8(buffer);
}

/** A synchronous method cannot reject: it answers with the value, or with the error. */
JSValueObject Value(JSValue value) {
  return JSValueObject{{"value", std::move(value)}};
}

JSValueObject Failure(std::string message) {
  return JSValueObject{{"error", std::move(message)}};
}

/** Runs `body` and answers with what it returns, or with the error it throws. */
template <typename TBody>
JSValue Answer(TBody body) noexcept {
  try {
    return Value(body());
  } catch (hresult_error const &error) {
    return Failure(Message(error));
  } catch (std::exception const &error) {
    return Failure(error.what());
  }
}

/** Where a copy or move lands: inside `to` when it is an existing directory, else at `to`. */
fs::path Destination(fs::path const &from, fs::path const &to) {
  std::error_code error;
  if (fs::is_directory(to, error)) return to / from.filename();
  return to;
}

/** The file extensions a MIME type (or a family, `image/*`) opens in a picker. */
std::vector<std::wstring> ExtensionsFor(std::string const &mime) {
  if (mime.empty() || mime == "*/*" || mime == "*") return {L"*"};
  if (mime.rfind("image/", 0) == 0) return {L".png", L".jpg", L".jpeg", L".gif", L".bmp", L".webp", L".tif", L".tiff", L".heic", L".svg"};
  if (mime.rfind("video/", 0) == 0) return {L".mp4", L".mov", L".mkv", L".avi", L".webm", L".m4v", L".wmv"};
  if (mime.rfind("audio/", 0) == 0) return {L".mp3", L".wav", L".m4a", L".flac", L".ogg", L".aac", L".wma"};
  if (mime == "application/pdf") return {L".pdf"};
  if (mime == "application/json") return {L".json"};
  if (mime == "application/zip") return {L".zip"};
  if (mime.rfind("text/", 0) == 0) return {L".txt", L".md", L".csv", L".json", L".html", L".xml"};
  return {L"*"};
}

std::string FileNameFromUrl(std::string const &url) {
  std::string name = url;
  auto query = name.find_first_of("?#");
  if (query != std::string::npos) name = name.substr(0, query);
  auto slash = name.find_last_of('/');
  if (slash != std::string::npos) name = name.substr(slash + 1);
  return name.empty() ? "download" : name;
}

/** An open file handle for `FileHandle`: the file, by mode. */
struct Handle {
  FILE *file{nullptr};
};

} // namespace

/**
 * `ExpoWindowsFileSystem`: what `expo-file-system` reads and writes through —
 * the app's cache and document folders in its local data, files and
 * directories by `file:` URI over the C++ file system, handles for byte
 * ranges, MD5 and the system's MIME registry, downloads and uploads over
 * `Windows.Web.Http` with progress, the file and folder pickers for the
 * app's window, and a directory watcher on `ReadDirectoryChangesW`. The
 * calls the package makes synchronously are synchronous here, answering
 * with the value or the error.
 */
REACT_MODULE(ExpoWindowsFileSystem)
struct ExpoWindowsFileSystem {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  ~ExpoWindowsFileSystem() {
    for (auto &[id, watch] : m_watches) StopWatch(watch);
    for (auto &[id, handle] : m_handles) {
      if (handle.file) std::fclose(handle.file);
    }
  }

  REACT_CONSTANT_PROVIDER(Constants)
  void Constants(ReactConstantProvider &provider) noexcept {
    try {
      auto data = AppDataFolder();
      std::error_code error;
      fs::create_directories(data / L"cache", error);
      fs::create_directories(data / L"documents", error);
      provider.Add(L"cacheDirectory", UriOf(data / L"cache", true));
      provider.Add(L"documentDirectory", UriOf(data / L"documents", true));
      provider.Add(L"bundleDirectory", UriOf(ExeDirectory(), true));
      ULARGE_INTEGER available{}, total{};
      if (GetDiskFreeSpaceExW(data.c_str(), &available, &total, nullptr)) {
        provider.Add(L"totalDiskSpace", static_cast<double>(total.QuadPart));
        provider.Add(L"availableDiskSpace", static_cast<double>(available.QuadPart));
      }
    } catch (...) {
    }
  }

  REACT_EVENT(OnFileSystemProgress, L"onFileSystemProgress")
  std::function<void(JSValue)> OnFileSystemProgress;

  REACT_EVENT(OnFileSystemChange, L"onFileSystemChange")
  std::function<void(JSValue)> OnFileSystemChange;

  // -- Entries -----------------------------------------------------------------

  REACT_SYNC_METHOD(Info, L"info")
  JSValue Info(std::string uri) noexcept {
    return Answer([&] {
      auto path = PathOf(uri);
      std::error_code error;
      auto status = fs::status(path, error);
      bool exists = fs::exists(status);
      bool directory = fs::is_directory(status);
      auto times = exists ? TimesOf(path) : Times{};
      double size = exists ? (directory ? static_cast<double>(DirectorySize(path)) : static_cast<double>(fs::file_size(path, error))) : 0;
      return JSValueObject{
          {"exists", exists},
          {"isDirectory", directory},
          {"uri", UriOf(path, directory)},
          {"size", size},
          {"modificationTime", times.modified},
          {"creationTime", times.created},
          {"type", exists && !directory ? MimeType(path) : std::string{}},
      };
    });
  }

  REACT_SYNC_METHOD(ReadText, L"readText")
  JSValue ReadText(std::string uri) noexcept {
    return Answer([&] { return ReadBytes(PathOf(uri)); });
  }

  REACT_SYNC_METHOD(ReadBase64, L"readBase64")
  JSValue ReadBase64(std::string uri) noexcept {
    return Answer([&] { return ToBase64(ReadBytes(PathOf(uri))); });
  }

  REACT_SYNC_METHOD(Write, L"write")
  JSValue Write(std::string uri, std::string content, bool base64, bool append) noexcept {
    return Answer([&] {
      auto path = PathOf(uri);
      std::error_code error;
      fs::create_directories(path.parent_path(), error);
      WriteBytes(path, base64 ? FromBase64(content) : content, append);
      return nullptr;
    });
  }

  REACT_SYNC_METHOD(Md5Of, L"md5")
  JSValue Md5Of(std::string uri) noexcept {
    return Answer([&] { return Md5(ReadBytes(PathOf(uri))); });
  }

  // Not `CreateFile` / `CreateDirectory`: those are Win32 macros over the wide functions used below.
  REACT_SYNC_METHOD(MakeFile, L"createFile")
  JSValue MakeFile(std::string uri, bool overwrite, bool intermediates) noexcept {
    return Answer([&] {
      auto path = PathOf(uri);
      std::error_code error;
      if (fs::exists(path, error) && !overwrite) throw hresult_error(E_FAIL, L"The file already exists: " + path.wstring());
      if (intermediates) fs::create_directories(path.parent_path(), error);
      WriteBytes(path, {}, false);
      return nullptr;
    });
  }

  REACT_SYNC_METHOD(MakeDirectory, L"createDirectory")
  JSValue MakeDirectory(std::string uri, bool overwrite, bool intermediates, bool idempotent) noexcept {
    return Answer([&] {
      auto path = PathOf(uri);
      std::error_code error;
      if (fs::exists(path, error)) {
        if (idempotent && fs::is_directory(path, error)) return nullptr;
        if (!overwrite) throw hresult_error(E_FAIL, L"The directory already exists: " + path.wstring());
        fs::remove_all(path, error);
      }
      bool made = intermediates ? fs::create_directories(path, error) : fs::create_directory(path, error);
      if (!made) throw hresult_error(E_FAIL, L"The directory could not be created: " + path.wstring() + L" (" + to_hstring(error.message()) + L")");
      return nullptr;
    });
  }

  REACT_SYNC_METHOD(Remove, L"remove")
  JSValue Remove(std::string uri, bool idempotent) noexcept {
    return Answer([&] {
      auto path = PathOf(uri);
      std::error_code error;
      if (!fs::exists(path, error)) {
        if (idempotent) return nullptr;
        throw hresult_error(E_FAIL, L"Nothing to delete at " + path.wstring());
      }
      fs::remove_all(path, error);
      if (error) throw hresult_error(E_FAIL, L"The entry could not be deleted: " + to_hstring(error.message()));
      return nullptr;
    });
  }

  REACT_SYNC_METHOD(Copy, L"copy")
  JSValue Copy(std::string from, std::string to, bool overwrite) noexcept {
    return Answer([&] {
      auto source = PathOf(from);
      auto destination = Destination(source, PathOf(to));
      std::error_code error;
      if (fs::exists(destination, error) && !overwrite) throw hresult_error(E_FAIL, L"The destination already exists: " + destination.wstring());
      bool directory = fs::is_directory(source, error);
      if (overwrite && fs::exists(destination, error)) fs::remove_all(destination, error);
      fs::create_directories(destination.parent_path(), error);
      fs::copy(source, destination, fs::copy_options::recursive | fs::copy_options::overwrite_existing, error);
      if (error) throw hresult_error(E_FAIL, L"The copy failed: " + to_hstring(error.message()));
      return UriOf(destination, directory);
    });
  }

  REACT_SYNC_METHOD(Move, L"move")
  JSValue Move(std::string from, std::string to, bool overwrite) noexcept {
    return Answer([&] {
      auto source = PathOf(from);
      auto destination = Destination(source, PathOf(to));
      std::error_code error;
      if (fs::exists(destination, error) && !overwrite) throw hresult_error(E_FAIL, L"The destination already exists: " + destination.wstring());
      bool directory = fs::is_directory(source, error);
      if (overwrite && fs::exists(destination, error)) fs::remove_all(destination, error);
      fs::create_directories(destination.parent_path(), error);
      fs::rename(source, destination, error);
      if (error) {
        // Across volumes a rename fails: copy, then remove.
        error.clear();
        fs::copy(source, destination, fs::copy_options::recursive | fs::copy_options::overwrite_existing, error);
        if (error) throw hresult_error(E_FAIL, L"The move failed: " + to_hstring(error.message()));
        fs::remove_all(source, error);
      }
      return UriOf(destination, directory);
    });
  }

  REACT_SYNC_METHOD(List, L"list")
  JSValue List(std::string uri) noexcept {
    return Answer([&] {
      auto path = PathOf(uri);
      std::error_code error;
      if (!fs::is_directory(path, error)) throw hresult_error(E_FAIL, L"Not a directory: " + path.wstring());
      JSValueArray entries;
      for (auto const &entry : fs::directory_iterator(path, fs::directory_options::skip_permission_denied, error)) {
        bool directory = entry.is_directory(error);
        entries.push_back(JSValueObject{{"uri", UriOf(entry.path(), directory)}, {"isDirectory", directory}});
      }
      return entries;
    });
  }

  // -- Handles -----------------------------------------------------------------

  REACT_SYNC_METHOD(Open, L"open")
  JSValue Open(std::string uri, std::string mode) noexcept {
    return Answer([&] {
      auto path = PathOf(uri);
      wchar_t const *flags = mode == "r" ? L"rb" : mode == "wa" ? L"ab" : mode == "wt" ? L"wb" : L"r+b";
      FILE *file = nullptr;
      _wfopen_s(&file, path.c_str(), flags);
      if (!file && mode != "r") _wfopen_s(&file, path.c_str(), L"w+b"); // read-write on a file not there yet
      if (!file) throw hresult_error(E_FAIL, L"The file could not be opened: " + path.wstring());
      int id = ++m_lastHandle;
      m_handles[id] = Handle{file};
      return id;
    });
  }

  REACT_SYNC_METHOD(ReadBytesAt, L"readBytes")
  JSValue ReadBytesAt(int id, int length) noexcept {
    return Answer([&] {
      auto &handle = HandleOf(id);
      std::string bytes(static_cast<size_t>(std::max(length, 0)), '\0');
      size_t read = std::fread(bytes.data(), 1, bytes.size(), handle.file);
      bytes.resize(read);
      return ToBase64(bytes);
    });
  }

  REACT_SYNC_METHOD(WriteBytesAt, L"writeBytes")
  JSValue WriteBytesAt(int id, std::string base64) noexcept {
    return Answer([&] {
      auto &handle = HandleOf(id);
      auto bytes = FromBase64(base64);
      if (std::fwrite(bytes.data(), 1, bytes.size(), handle.file) != bytes.size()) throw hresult_error(E_FAIL, L"The bytes could not be written");
      std::fflush(handle.file);
      return nullptr;
    });
  }

  REACT_SYNC_METHOD(HandleInfo, L"handleInfo")
  JSValue HandleInfo(int id) noexcept {
    return Answer([&] {
      auto &handle = HandleOf(id);
      return JSValueObject{{"offset", static_cast<double>(_ftelli64(handle.file))}, {"size", static_cast<double>(_filelengthi64(_fileno(handle.file)))}};
    });
  }

  REACT_SYNC_METHOD(Seek, L"seek")
  JSValue Seek(int id, double offset) noexcept {
    return Answer([&] {
      auto &handle = HandleOf(id);
      if (_fseeki64(handle.file, static_cast<long long>(offset), SEEK_SET) != 0) throw hresult_error(E_FAIL, L"The offset is out of the file");
      return nullptr;
    });
  }

  REACT_SYNC_METHOD(Close, L"close")
  JSValue Close(int id) noexcept {
    return Answer([&] {
      auto found = m_handles.find(id);
      if (found == m_handles.end()) return nullptr;
      if (found->second.file) std::fclose(found->second.file);
      m_handles.erase(found);
      return nullptr;
    });
  }

  // -- The network -------------------------------------------------------------

  REACT_METHOD(Download, L"download")
  void Download(std::string url, std::string toUri, JSValue headers, std::string taskId, ReactPromise<std::string> promise) noexcept {
    try {
      auto destination = PathOf(toUri);
      std::error_code error;
      if (fs::is_directory(destination, error) || toUri.back() == '/') destination = destination / fs::path(ToWide(FileNameFromUrl(url)));
      fs::create_directories(destination.parent_path(), error);
      HttpClient client;
      HttpRequestMessage request(HttpMethod::Get(), Uri(to_hstring(url)));
      if (headers.Type() == JSValueType::Object) {
        for (auto const &[name, value] : headers.AsObject()) request.Headers().TryAppendWithoutValidation(to_hstring(name), to_hstring(value.AsString()));
      }
      auto operation = client.SendRequestAsync(request, HttpCompletionOption::ResponseHeadersRead);
      m_operations[taskId] = operation;
      operation.Completed([this, destination, taskId, promise, client](IAsyncOperationWithProgress<HttpResponseMessage, HttpProgress> const &sender, winrt::Windows::Foundation::AsyncStatus status) {
        try {
          if (status == winrt::Windows::Foundation::AsyncStatus::Canceled) throw hresult_canceled();
          auto response = sender.GetResults();
          if (!response.IsSuccessStatusCode()) throw hresult_error(E_FAIL, L"The download answered " + to_hstring(static_cast<int>(response.StatusCode())));
          uint64_t total = response.Content().Headers().ContentLength() ? response.Content().Headers().ContentLength().Value() : 0;
          auto file = StorageFile::GetFileFromPathAsync(destination.parent_path().c_str());
          // Written through a file stream of our own, so the bytes land where the package asked.
          auto stream = FileRandomAccessStream::OpenAsync(destination.c_str(), FileAccessMode::ReadWrite, StorageOpenOptions::None, FileOpenDisposition::CreateAlways);
          stream.Completed([this, response, destination, taskId, promise, total, client](IAsyncOperation<IRandomAccessStream> const &opened, winrt::Windows::Foundation::AsyncStatus openStatus) {
            try {
              if (openStatus != winrt::Windows::Foundation::AsyncStatus::Completed) throw hresult_error(E_FAIL, L"The file could not be created: " + destination.wstring());
              auto target = opened.GetResults();
              auto writing = response.Content().WriteToStreamAsync(target);
              m_writes[taskId] = writing;
              writing.Progress([this, taskId, total](auto const &, uint64_t written) {
                OnFileSystemProgress(JSValueObject{{"taskId", taskId}, {"bytesWritten", static_cast<double>(written)}, {"totalBytes", static_cast<double>(total)}});
              });
              writing.Completed([this, destination, taskId, promise, target, client](IAsyncOperationWithProgress<uint64_t, uint64_t> const &done, winrt::Windows::Foundation::AsyncStatus writeStatus) {
                m_operations.erase(taskId);
                m_writes.erase(taskId);
                try {
                  if (writeStatus == winrt::Windows::Foundation::AsyncStatus::Canceled) throw hresult_canceled();
                  done.GetResults();
                  target.Close();
                  promise.Resolve(UriOf(destination, false));
                } catch (hresult_canceled const &) {
                  target.Close();
                  promise.Reject("The download was cancelled");
                } catch (hresult_error const &error) {
                  promise.Reject(Message(error).c_str());
                }
              });
            } catch (hresult_error const &error) {
              m_operations.erase(taskId);
              promise.Reject(Message(error).c_str());
            }
          });
        } catch (hresult_canceled const &) {
          m_operations.erase(taskId);
          promise.Reject("The download was cancelled");
        } catch (hresult_error const &error) {
          m_operations.erase(taskId);
          promise.Reject(Message(error).c_str());
        }
      });
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_METHOD(Upload, L"upload")
  void Upload(std::string url, std::string fileUri, JSValue options, std::string taskId, ReactPromise<JSValue> promise) noexcept {
    try {
      auto path = PathOf(fileUri);
      auto const &settings = options.AsObject();
      std::string method = settings["httpMethod"].Type() == JSValueType::String ? settings["httpMethod"].AsString() : "POST";
      bool multipart = settings["uploadType"].Type() == JSValueType::Double || settings["uploadType"].Type() == JSValueType::Int64 ? settings["uploadType"].AsInt32() == 1 : false;
      std::string fieldName = settings["fieldName"].Type() == JSValueType::String ? settings["fieldName"].AsString() : "file";
      std::string mimeType = settings["mimeType"].Type() == JSValueType::String ? settings["mimeType"].AsString() : MimeType(path);
      if (mimeType.empty()) mimeType = "application/octet-stream";
      auto opening = FileRandomAccessStream::OpenAsync(path.c_str(), FileAccessMode::Read);
      opening.Completed([this, url, method, multipart, fieldName, mimeType, path, options = options.Copy(), taskId, promise](IAsyncOperation<IRandomAccessStream> const &opened, winrt::Windows::Foundation::AsyncStatus status) {
        try {
          if (status != winrt::Windows::Foundation::AsyncStatus::Completed) throw hresult_error(E_FAIL, L"The file could not be read: " + path.wstring());
          auto stream = opened.GetResults();
          auto const &settings = options.AsObject();
          HttpClient client;
          HttpRequestMessage request(HttpMethod(to_hstring(method)), Uri(to_hstring(url)));
          if (settings["headers"].Type() == JSValueType::Object) {
            for (auto const &[name, value] : settings["headers"].AsObject()) request.Headers().TryAppendWithoutValidation(to_hstring(name), to_hstring(value.AsString()));
          }
          HttpStreamContent body(stream);
          body.Headers().ContentType(Headers::HttpMediaTypeHeaderValue(to_hstring(mimeType)));
          if (multipart) {
            HttpMultipartFormDataContent form;
            if (settings["parameters"].Type() == JSValueType::Object) {
              for (auto const &[name, value] : settings["parameters"].AsObject()) form.Add(HttpStringContent(to_hstring(value.AsString())), to_hstring(name));
            }
            form.Add(body, to_hstring(fieldName), path.filename().c_str());
            request.Content(form);
          } else {
            request.Content(body);
          }
          auto operation = client.SendRequestAsync(request);
          m_operations[taskId] = operation;
          operation.Progress([this, taskId](auto const &, HttpProgress const &progress) {
            OnFileSystemProgress(JSValueObject{
                {"taskId", taskId},
                {"bytesSent", static_cast<double>(progress.BytesSent)},
                {"totalBytes", progress.TotalBytesToSend ? static_cast<double>(progress.TotalBytesToSend.Value()) : 0.0}});
          });
          operation.Completed([this, taskId, promise, client, stream](IAsyncOperationWithProgress<HttpResponseMessage, HttpProgress> const &sender, winrt::Windows::Foundation::AsyncStatus sendStatus) {
            m_operations.erase(taskId);
            try {
              if (sendStatus == winrt::Windows::Foundation::AsyncStatus::Canceled) throw hresult_canceled();
              auto response = sender.GetResults();
              auto reading = response.Content().ReadAsStringAsync();
              reading.Completed([response, promise, stream](IAsyncOperationWithProgress<hstring, uint64_t> const &read, winrt::Windows::Foundation::AsyncStatus) {
                try {
                  JSValueObject headers;
                  for (auto const &header : response.Headers()) headers[ToUtf8(header.Key())] = ToUtf8(header.Value());
                  for (auto const &header : response.Content().Headers()) headers[ToUtf8(header.Key())] = ToUtf8(header.Value());
                  promise.Resolve(JSValueObject{{"status", static_cast<int>(response.StatusCode())}, {"headers", std::move(headers)}, {"body", ToUtf8(read.GetResults())}});
                } catch (hresult_error const &error) {
                  promise.Reject(Message(error).c_str());
                }
                stream.Close();
              });
            } catch (hresult_canceled const &) {
              promise.Reject("The upload was cancelled");
            } catch (hresult_error const &error) {
              promise.Reject(Message(error).c_str());
            }
          });
        } catch (hresult_error const &error) {
          promise.Reject(Message(error).c_str());
        }
      });
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_METHOD(Cancel, L"cancel")
  void Cancel(std::string taskId) noexcept {
    if (auto write = m_writes.find(taskId); write != m_writes.end()) write->second.Cancel();
    if (auto operation = m_operations.find(taskId); operation != m_operations.end()) operation->second.Cancel();
  }

  // -- Pickers -----------------------------------------------------------------

  REACT_METHOD(PickFile, L"pickFile")
  void PickFile(std::string initialUri, JSValue mimeTypes, bool multiple, ReactPromise<JSValue> promise) noexcept {
    m_context.UIDispatcher().Post([initialUri, mimeTypes = mimeTypes.Copy(), multiple, promise] {
      try {
        HWND window = MainWindow();
        if (!window) throw hresult_error(E_FAIL, L"The app has no window yet");
        FileOpenPicker picker;
        picker.as<IInitializeWithWindow>()->Initialize(window);
        picker.SuggestedStartLocation(PickerLocationId::DocumentsLibrary);
        std::set<std::wstring> extensions;
        if (mimeTypes.Type() == JSValueType::Array) {
          for (auto const &mime : mimeTypes.AsArray()) {
            for (auto const &extension : ExtensionsFor(mime.AsString())) extensions.insert(extension);
          }
        }
        if (extensions.empty() || extensions.count(L"*")) extensions = {L"*"};
        for (auto const &extension : extensions) picker.FileTypeFilter().Append(extension);
        if (multiple) {
          picker.PickMultipleFilesAsync().Completed([promise](IAsyncOperation<Collections::IVectorView<StorageFile>> const &operation, winrt::Windows::Foundation::AsyncStatus status) {
            try {
              auto files = status == winrt::Windows::Foundation::AsyncStatus::Completed ? operation.GetResults() : nullptr;
              if (!files || files.Size() == 0) throw hresult_canceled();
              JSValueArray picked;
              for (auto const &file : files) picked.push_back(JSValueObject{{"uri", UriOf(fs::path(std::wstring(file.Path())), false)}});
              promise.Resolve(std::move(picked));
            } catch (hresult_canceled const &) {
              promise.Reject("The user did not pick a file");
            } catch (hresult_error const &error) {
              promise.Reject(Message(error).c_str());
            }
          });
        } else {
          picker.PickSingleFileAsync().Completed([promise](IAsyncOperation<StorageFile> const &operation, winrt::Windows::Foundation::AsyncStatus status) {
            try {
              auto file = status == winrt::Windows::Foundation::AsyncStatus::Completed ? operation.GetResults() : nullptr;
              if (!file) throw hresult_canceled();
              promise.Resolve(JSValueObject{{"uri", UriOf(fs::path(std::wstring(file.Path())), false)}});
            } catch (hresult_canceled const &) {
              promise.Reject("The user did not pick a file");
            } catch (hresult_error const &error) {
              promise.Reject(Message(error).c_str());
            }
          });
        }
      } catch (hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

  REACT_METHOD(PickDirectory, L"pickDirectory")
  void PickDirectory(std::string initialUri, ReactPromise<JSValue> promise) noexcept {
    static_cast<void>(initialUri); // the pickers start where the user last was; a start location is not theirs to take
    m_context.UIDispatcher().Post([promise] {
      try {
        HWND window = MainWindow();
        if (!window) throw hresult_error(E_FAIL, L"The app has no window yet");
        FolderPicker picker;
        picker.as<IInitializeWithWindow>()->Initialize(window);
        picker.SuggestedStartLocation(PickerLocationId::DocumentsLibrary);
        picker.FileTypeFilter().Append(L"*");
        picker.PickSingleFolderAsync().Completed([promise](IAsyncOperation<StorageFolder> const &operation, winrt::Windows::Foundation::AsyncStatus status) {
          try {
            auto folder = status == winrt::Windows::Foundation::AsyncStatus::Completed ? operation.GetResults() : nullptr;
            if (!folder) throw hresult_canceled();
            promise.Resolve(JSValueObject{{"uri", UriOf(fs::path(std::wstring(folder.Path())), true)}});
          } catch (hresult_canceled const &) {
            promise.Reject("The user did not pick a folder");
          } catch (hresult_error const &error) {
            promise.Reject(Message(error).c_str());
          }
        });
      } catch (hresult_error const &error) {
        promise.Reject(Message(error).c_str());
      }
    });
  }

  // -- Watching ----------------------------------------------------------------

  REACT_SYNC_METHOD(Watch, L"watch")
  JSValue Watch(int id, std::string uri) noexcept {
    return Answer([&] {
      auto path = PathOf(uri);
      std::error_code error;
      if (!fs::exists(path, error)) throw hresult_error(E_FAIL, L"Nothing to watch at " + path.wstring());
      bool directory = fs::is_directory(path, error);
      auto watch = std::make_shared<WatchState>();
      watch->directory = directory ? path : path.parent_path();
      watch->only = directory ? std::wstring{} : path.filename().wstring();
      watch->recursive = directory;
      watch->stop = CreateEventW(nullptr, TRUE, FALSE, nullptr);
      watch->handle = CreateFileW(
          watch->directory.c_str(), FILE_LIST_DIRECTORY, FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE, nullptr, OPEN_EXISTING,
          FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OVERLAPPED, nullptr);
      if (watch->handle == INVALID_HANDLE_VALUE) throw_last_error();
      m_watches[id] = watch;
      watch->thread = std::thread([this, id, watch] { Observe(id, *watch); });
      return nullptr;
    });
  }

  REACT_SYNC_METHOD(Unwatch, L"unwatch")
  JSValue Unwatch(int id) noexcept {
    return Answer([&] {
      auto found = m_watches.find(id);
      if (found == m_watches.end()) return nullptr;
      StopWatch(found->second);
      m_watches.erase(found);
      return nullptr;
    });
  }

 private:
  struct WatchState {
    fs::path directory;
    std::wstring only;
    bool recursive{false};
    HANDLE handle{INVALID_HANDLE_VALUE};
    HANDLE stop{nullptr};
    std::thread thread;
  };

  Handle &HandleOf(int id) {
    auto found = m_handles.find(id);
    if (found == m_handles.end() || !found->second.file) throw hresult_error(E_FAIL, L"The file handle is closed");
    return found->second;
  }

  void StopWatch(std::shared_ptr<WatchState> const &watch) noexcept {
    if (watch->stop) SetEvent(watch->stop);
    if (watch->handle != INVALID_HANDLE_VALUE) CancelIoEx(watch->handle, nullptr);
    if (watch->thread.joinable()) watch->thread.join();
    if (watch->handle != INVALID_HANDLE_VALUE) CloseHandle(watch->handle);
    if (watch->stop) CloseHandle(watch->stop);
    watch->handle = INVALID_HANDLE_VALUE;
    watch->stop = nullptr;
  }

  /** The watch thread: `ReadDirectoryChangesW`, each change an event, until stopped. */
  void Observe(int id, WatchState &watch) noexcept {
    std::vector<uint8_t> buffer(64 * 1024);
    OVERLAPPED overlapped{};
    overlapped.hEvent = CreateEventW(nullptr, TRUE, FALSE, nullptr);
    std::wstring renamedFrom;
    while (true) {
      DWORD returned = 0;
      ResetEvent(overlapped.hEvent);
      if (!ReadDirectoryChangesW(
              watch.handle, buffer.data(), static_cast<DWORD>(buffer.size()), watch.recursive,
              FILE_NOTIFY_CHANGE_FILE_NAME | FILE_NOTIFY_CHANGE_DIR_NAME | FILE_NOTIFY_CHANGE_SIZE | FILE_NOTIFY_CHANGE_LAST_WRITE | FILE_NOTIFY_CHANGE_CREATION,
              &returned, &overlapped, nullptr)) {
        break;
      }
      HANDLE waits[2] = {overlapped.hEvent, watch.stop};
      if (WaitForMultipleObjects(2, waits, FALSE, INFINITE) != WAIT_OBJECT_0) break;
      if (!GetOverlappedResult(watch.handle, &overlapped, &returned, FALSE) || returned == 0) continue;
      size_t offset = 0;
      while (true) {
        auto *info = reinterpret_cast<FILE_NOTIFY_INFORMATION *>(buffer.data() + offset);
        std::wstring name(info->FileName, info->FileNameLength / sizeof(wchar_t));
        fs::path path = watch.directory / name;
        bool concerned = watch.only.empty() || name == watch.only;
        std::error_code error;
        bool directory = fs::is_directory(path, error);
        if (info->Action == FILE_ACTION_RENAMED_OLD_NAME) {
          renamedFrom = name;
        } else if (concerned || (info->Action == FILE_ACTION_RENAMED_NEW_NAME && !watch.only.empty() && renamedFrom == watch.only)) {
          char const *type = info->Action == FILE_ACTION_ADDED ? "created"
              : info->Action == FILE_ACTION_REMOVED ? "deleted"
              : info->Action == FILE_ACTION_MODIFIED ? "modified"
              : info->Action == FILE_ACTION_RENAMED_NEW_NAME ? "renamed"
                                                               : nullptr;
          if (type) {
            JSValueObject event{{"id", id}, {"type", type}, {"isDirectory", directory}};
            if (info->Action == FILE_ACTION_RENAMED_NEW_NAME) {
              event["path"] = UriOf(watch.directory / renamedFrom, directory);
              event["newPath"] = UriOf(path, directory);
              event["newPathIsDirectory"] = directory;
            } else {
              event["path"] = UriOf(path, directory);
            }
            OnFileSystemChange(std::move(event));
          }
        }
        if (info->NextEntryOffset == 0) break;
        offset += info->NextEntryOffset;
      }
    }
    CloseHandle(overlapped.hEvent);
  }

  ReactContext m_context;
  std::map<int, Handle> m_handles;
  int m_lastHandle{0};
  std::map<std::string, IAsyncOperationWithProgress<HttpResponseMessage, HttpProgress>> m_operations;
  std::map<std::string, IAsyncOperationWithProgress<uint64_t, uint64_t>> m_writes;
  std::map<int, std::shared_ptr<WatchState>> m_watches;
};

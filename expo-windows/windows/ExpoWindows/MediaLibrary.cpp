#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Foundation;
using namespace winrt::Windows::Foundation::Collections;
using namespace winrt::Windows::Storage;
using namespace winrt::Windows::Storage::FileProperties;
using namespace winrt::Windows::Storage::Search;
using namespace ExpoWindows;

namespace fs = std::filesystem;

namespace {

/** The kinds the package sorts assets into, by the file's content type. */
char const *KindOf(StorageFile const &file) {
  hstring type = file.ContentType();
  if (type.starts_with(L"image/")) return "photo";
  if (type.starts_with(L"video/")) return "video";
  if (type.starts_with(L"audio/")) return "audio";
  return "unknown";
}

/** The known folder a kind's assets live in: pictures, videos, music. */
KNOWNFOLDERID const &FolderIdFor(std::string_view kind) {
  if (kind == "video") return FOLDERID_Videos;
  if (kind == "audio") return FOLDERID_Music;
  return FOLDERID_Pictures;
}

fs::path KnownPath(KNOWNFOLDERID const &id) {
  PWSTR raw = nullptr;
  check_hresult(SHGetKnownFolderPath(id, 0, nullptr, &raw));
  fs::path path(raw);
  CoTaskMemFree(raw);
  return path;
}

/** The three folders the library is: pictures, videos and music. */
std::array<fs::path, 3> Libraries() {
  return {KnownPath(FOLDERID_Pictures), KnownPath(FOLDERID_Videos), KnownPath(FOLDERID_Music)};
}

/** Whether `path` is one of the library folders themselves. */
bool IsLibraryRoot(fs::path const &path) {
  for (auto const &library : Libraries()) {
    if (_wcsicmp(library.c_str(), path.c_str()) == 0) return true;
  }
  return false;
}

double Ms(DateTime const &time) {
  return static_cast<double>((time.time_since_epoch().count() - 116444736000000000LL) / 10000);
}

double Seconds(TimeSpan const &span) {
  return std::chrono::duration<double>(span).count();
}

std::string UriOf(std::wstring const &path) {
  std::string generic = ToUtf8(fs::path(path).generic_wstring());
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

fs::path PathOf(std::string const &idOrUri) {
  if (idOrUri.rfind("file:", 0) == 0) {
    std::wstring path = PathFromUri(idOrUri);
    if (path.empty()) throw hresult_invalid_argument(L"Not a file path: " + to_hstring(idOrUri));
    return fs::path(path);
  }
  return fs::path(ToWide(idOrUri));
}

/** The properties the query prefetches, so that listing does not open every file. */
QueryOptions DeepMediaQuery() {
  QueryOptions options(CommonFileQuery::OrderByDate, nullptr);
  options.FolderDepth(FolderDepth::Deep);
  options.IndexerOption(IndexerOption::UseIndexerWhenAvailable);
  options.SetPropertyPrefetch(
      PropertyPrefetchOptions::BasicProperties | PropertyPrefetchOptions::ImageProperties | PropertyPrefetchOptions::VideoProperties | PropertyPrefetchOptions::MusicProperties, nullptr);
  return options;
}

/** The asset record the package reads, from a file in a library; `full` adds what `getAssetInfoAsync` shows. */
JSValue AssetOf(StorageFile const &file, bool full) {
  std::string kind = KindOf(file);
  std::wstring path(file.Path());
  auto basic = file.GetBasicPropertiesAsync().get();
  JSValueObject asset{
      {"id", ToUtf8(path)},
      {"filename", to_string(file.Name())},
      {"uri", UriOf(path)},
      {"mediaType", kind},
      {"width", 0},
      {"height", 0},
      {"creationTime", Ms(file.DateCreated())},
      {"modificationTime", Ms(basic.DateModified())},
      {"duration", 0},
  };
  auto parent = fs::path(path).parent_path();
  if (IsLibraryRoot(parent)) asset["albumId"] = nullptr;
  else asset["albumId"] = ToUtf8(parent.wstring());
  JSValueObject exif;
  if (kind == "photo") {
    auto image = file.Properties().GetImagePropertiesAsync().get();
    asset["width"] = static_cast<int>(image.Width());
    asset["height"] = static_cast<int>(image.Height());
    if (auto taken = image.DateTaken(); taken.time_since_epoch().count() > 0) {
      asset["creationTime"] = Ms(taken);
      exif["DateTimeOriginal"] = Ms(taken);
    }
    if (full) {
      asset["orientation"] = static_cast<int>(image.Orientation());
      exif["Orientation"] = static_cast<int>(image.Orientation());
      if (!image.CameraManufacturer().empty()) exif["Make"] = to_string(image.CameraManufacturer());
      if (!image.CameraModel().empty()) exif["Model"] = to_string(image.CameraModel());
      if (!image.Title().empty()) exif["ImageDescription"] = to_string(image.Title());
      if (image.Latitude() && image.Longitude()) {
        asset["location"] = JSValueObject{{"latitude", image.Latitude().Value()}, {"longitude", image.Longitude().Value()}};
        exif["GPSLatitude"] = image.Latitude().Value();
        exif["GPSLongitude"] = image.Longitude().Value();
      }
    }
  } else if (kind == "video") {
    auto video = file.Properties().GetVideoPropertiesAsync().get();
    asset["width"] = static_cast<int>(video.Width());
    asset["height"] = static_cast<int>(video.Height());
    asset["duration"] = Seconds(video.Duration());
    if (full) {
      asset["orientation"] = static_cast<int>(video.Orientation());
      if (video.Latitude() && video.Longitude()) {
        asset["location"] = JSValueObject{{"latitude", video.Latitude().Value()}, {"longitude", video.Longitude().Value()}};
      }
    }
  } else if (kind == "audio") {
    auto music = file.Properties().GetMusicPropertiesAsync().get();
    asset["duration"] = Seconds(music.Duration());
    if (full && !music.Title().empty()) exif["Title"] = to_string(music.Title());
  }
  if (full) {
    asset["localUri"] = UriOf(path);
    asset["exif"] = std::move(exif);
    asset["isFavorite"] = false;
  }
  return JSValue(std::move(asset));
}

/** The album record the package reads, from a folder under a library. */
JSValue AlbumOf(StorageFolder const &folder) {
  auto files = folder.GetFilesAsync().get();
  return JSValue(JSValueObject{
      {"id", ToUtf8(std::wstring(folder.Path()))},
      {"title", to_string(folder.Name())},
      {"assetCount", static_cast<int>(files.Size())},
      {"type", "album"},
      {"startTime", 0},
      {"endTime", 0},
  });
}

IAsyncOperation<StorageFolder> FolderAt(fs::path path) {
  co_return co_await StorageFolder::GetFolderFromPathAsync(path.c_str());
}

IAsyncOperation<StorageFile> FileAt(fs::path path) {
  co_return co_await StorageFile::GetFileFromPathAsync(path.c_str());
}

/** Every media file under a library folder, deep; or the files of one album, shallow. */
IAsyncOperation<IVectorView<StorageFile>> FilesOf(StorageFolder folder, bool deep) {
  if (!deep) co_return co_await folder.GetFilesAsync();
  auto query = folder.CreateFileQueryWithOptions(DeepMediaQuery());
  co_return co_await query.GetFilesAsync();
}

/** The file moved or copied into the folder, keeping its name unless that name is taken. */
IAsyncOperation<StorageFile> Placed(StorageFile file, StorageFolder folder, bool copy) {
  if (copy) co_return co_await file.CopyAsync(folder, file.Name(), NameCollisionOption::GenerateUniqueName);
  co_await file.MoveAsync(folder, file.Name(), NameCollisionOption::GenerateUniqueName);
  co_return file;
}

} // namespace

/**
 * `ExpoWindowsMediaLibrary`: what `expo-media-library` reads and writes
 * through — the user's Pictures, Videos and Music folders as the library,
 * their sub-folders as albums, each media file as an asset with the sizes,
 * times and duration the shell indexes for it, and the shell's change
 * notifications for the library as a whole.
 */
REACT_MODULE(ExpoWindowsMediaLibrary)
struct ExpoWindowsMediaLibrary {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  REACT_EVENT(OnMediaLibraryChange, L"onMediaLibraryChange")
  std::function<void(JSValue)> OnMediaLibraryChange;

  /** The assets of an album (its folder, shallow), or of the whole library (the three folders, deep). */
  REACT_METHOD(Assets, L"assets")
  fire_and_forget Assets(std::string album, ReactPromise<JSValue> promise) noexcept {
    try {
      co_await resume_background();
      JSValueArray assets;
      if (album.empty()) {
        for (auto const &library : Libraries()) {
          std::error_code error;
          if (!fs::is_directory(library, error)) continue;
          auto files = co_await FilesOf(co_await FolderAt(library), true);
          for (auto const &file : files) {
            if (std::string_view(KindOf(file)) == "unknown") continue;
            assets.push_back(AssetOf(file, false));
          }
        }
      } else {
        auto files = co_await FilesOf(co_await FolderAt(PathOf(album)), false);
        for (auto const &file : files) {
          if (std::string_view(KindOf(file)) == "unknown") continue;
          assets.push_back(AssetOf(file, false));
        }
      }
      promise.Resolve(JSValue(std::move(assets)));
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_METHOD(AssetInfo, L"assetInfo")
  fire_and_forget AssetInfo(std::string id, ReactPromise<JSValue> promise) noexcept {
    try {
      co_await resume_background();
      promise.Resolve(AssetOf(co_await FileAt(PathOf(id)), true));
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** The albums: the folders directly under the three libraries. */
  REACT_METHOD(Albums, L"albums")
  fire_and_forget Albums(ReactPromise<JSValue> promise) noexcept {
    try {
      co_await resume_background();
      JSValueArray albums;
      for (auto const &library : Libraries()) {
        std::error_code error;
        if (!fs::is_directory(library, error)) continue;
        auto folders = co_await (co_await FolderAt(library)).GetFoldersAsync();
        for (auto const &folder : folders) albums.push_back(AlbumOf(folder));
      }
      promise.Resolve(JSValue(std::move(albums)));
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** A file copied into an album, or into the library for its kind; the asset the copy is. */
  REACT_METHOD(CreateAsset, L"createAsset")
  fire_and_forget CreateAsset(std::string localUri, std::string album, ReactPromise<JSValue> promise) noexcept {
    try {
      co_await resume_background();
      auto file = co_await FileAt(PathOf(localUri));
      auto target = album.empty() ? KnownPath(FolderIdFor(KindOf(file))) : PathOf(album);
      std::error_code error;
      fs::create_directories(target, error);
      auto copy = co_await Placed(file, co_await FolderAt(target), true);
      promise.Resolve(AssetOf(copy, false));
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** A folder under the library for the asset's kind (pictures without one), the asset copied or moved in. */
  REACT_METHOD(CreateAlbum, L"createAlbum")
  fire_and_forget CreateAlbum(std::string name, std::string assetId, bool move, ReactPromise<JSValue> promise) noexcept {
    try {
      co_await resume_background();
      StorageFile asset{nullptr};
      if (!assetId.empty()) asset = co_await FileAt(PathOf(assetId));
      auto library = co_await FolderAt(KnownPath(FolderIdFor(asset ? KindOf(asset) : "photo")));
      auto folder = co_await library.CreateFolderAsync(to_hstring(name), CreationCollisionOption::OpenIfExists);
      if (asset) co_await Placed(asset, folder, !move);
      promise.Resolve(AlbumOf(folder));
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_METHOD(DeleteAssets, L"deleteAssets")
  fire_and_forget DeleteAssets(JSValue ids, ReactPromise<bool> promise) noexcept {
    try {
      co_await resume_background();
      for (auto const &id : ids.AsArray()) {
        auto file = co_await FileAt(PathOf(id.AsString()));
        co_await file.DeleteAsync();
      }
      promise.Resolve(true);
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** Albums removed; their assets with them, or first moved up into the library. */
  REACT_METHOD(DeleteAlbums, L"deleteAlbums")
  fire_and_forget DeleteAlbums(JSValue ids, bool deleteAssets, ReactPromise<bool> promise) noexcept {
    try {
      co_await resume_background();
      for (auto const &id : ids.AsArray()) {
        auto path = PathOf(id.AsString());
        if (IsLibraryRoot(path)) throw hresult_invalid_argument(L"The library itself is not an album to delete");
        auto folder = co_await FolderAt(path);
        if (!deleteAssets) {
          auto parent = co_await FolderAt(path.parent_path());
          for (auto const &file : co_await folder.GetFilesAsync()) co_await Placed(file, parent, false);
        }
        co_await folder.DeleteAsync();
      }
      promise.Resolve(true);
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_METHOD(AddAssetsToAlbum, L"addAssetsToAlbum")
  fire_and_forget AddAssetsToAlbum(JSValue ids, std::string album, bool copy, ReactPromise<bool> promise) noexcept {
    try {
      co_await resume_background();
      auto folder = co_await FolderAt(PathOf(album));
      for (auto const &id : ids.AsArray()) co_await Placed(co_await FileAt(PathOf(id.AsString())), folder, copy);
      promise.Resolve(true);
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** Assets moved out of an album, up into the library it is in. */
  REACT_METHOD(RemoveAssetsFromAlbum, L"removeAssetsFromAlbum")
  fire_and_forget RemoveAssetsFromAlbum(JSValue ids, std::string album, ReactPromise<bool> promise) noexcept {
    try {
      co_await resume_background();
      auto parent = co_await FolderAt(PathOf(album).parent_path());
      for (auto const &id : ids.AsArray()) co_await Placed(co_await FileAt(PathOf(id.AsString())), parent, false);
      promise.Resolve(true);
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  /** The shell's change notifications for the three libraries, on or off. */
  REACT_METHOD(Watch, L"watch")
  fire_and_forget Watch(bool on) noexcept {
    try {
      co_await resume_background();
      if (!on) {
        for (auto &[query, token] : m_queries) query.ContentsChanged(token);
        m_queries.clear();
        co_return;
      }
      if (!m_queries.empty()) co_return;
      for (auto const &library : Libraries()) {
        std::error_code error;
        if (!fs::is_directory(library, error)) continue;
        auto folder = co_await FolderAt(library);
        auto query = folder.CreateFileQueryWithOptions(DeepMediaQuery());
        co_await query.GetFilesAsync(0, 1);
        auto token = query.ContentsChanged([this](auto const &, auto const &) {
          if (OnMediaLibraryChange) OnMediaLibraryChange(JSValueObject{{"hasIncrementalChanges", false}});
        });
        m_queries.emplace_back(query, token);
      }
    } catch (hresult_error const &) {
    }
  }

 private:
  ReactContext m_context;
  std::vector<std::pair<StorageFileQueryResult, event_token>> m_queries;
};

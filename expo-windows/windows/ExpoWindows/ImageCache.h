#pragma once

#include "pch.h"

/**
 * What the image island and the image loader share: the fetch of a source
 * into memory or the disk cache, the sniffed media type, the memory cache
 * of decoded sources, and the blurhash codec.
 */
namespace ExpoWindows::ImageCache {

/** A fetch of one image source: what is asked, and what came of it. */
struct Fetch {
  std::string uri;
  std::map<std::string, std::string> headers;
  /** The key the disk cache files it under; empty for the URI itself. */
  std::string cacheKey;
  /** none, disk, memory or memory-disk: whether the bytes are kept on disk. */
  std::string policy{"disk"};
  /** Told the bytes so far and the total (0 when unknown), on a background thread. */
  std::function<void(uint64_t, uint64_t)> progress;

  // What came of it.
  /** The bytes, when they are not in a file. */
  winrt::Windows::Storage::Streams::IRandomAccessStream stream{nullptr};
  /** The file, when there is one: the cached copy, or the local file the URI named. */
  std::wstring path;
  /** none, or disk when the cached copy answered. */
  std::string cacheType{"none"};
  /** The media type sniffed from the bytes; empty when no codec is known for them. */
  std::string mediaType;
  /** The first bytes, for what parses a header (an SVG's size). */
  std::vector<uint8_t> head;
  /** Why nothing came, when nothing did. */
  std::string error;
};

/** `cache\ExpoImage` under the app's local data, created. */
std::filesystem::path Folder();

/** The key a source is cached under: its own, or its URI. */
std::string KeyOf(std::string const &uri, std::string const &cacheKey);

/** The cached file for a key: the folder and the key's SHA-256, whether or not it exists. */
std::filesystem::path FileFor(std::string const &key);

/**
 * Fetches the source: a `data:` URI decoded into memory, a file path or
 * `file:` URI as it is, an `http(s):` URL from the disk cache when the
 * policy keeps one and the file is there, else downloaded — into the
 * cache under the policy's say, into memory otherwise. Never throws: what
 * went wrong is in `error`.
 */
winrt::Windows::Foundation::IAsyncAction FetchAsync(std::shared_ptr<Fetch> fetch);

/** Removes every cached file; whether all of them went. */
bool ClearDisk();

/** The media type the first bytes say (PNG, JPEG, GIF, WebP, BMP, TIFF, HEIF, SVG), or empty. */
std::string MediaTypeOf(uint8_t const *bytes, size_t count);

/** The size an SVG document declares (its viewBox, else width and height); zeros when it declares none. */
std::pair<double, double> SvgSizeOf(std::vector<uint8_t> const &head);

/** A decoded source the memory cache holds, with what is known about it. */
struct Cached {
  winrt::Microsoft::UI::Xaml::Media::ImageSource source{nullptr};
  int32_t width{0};
  int32_t height{0};
  bool animated{false};
  std::string mediaType;
};

/** The memory cache, for the UI thread: the entry for a key, or one with no source. */
Cached FromMemory(std::string const &key);
void ToMemory(std::string const &key, Cached const &entry);
void ClearMemory();

/**
 * Decodes a blurhash into premultiplied BGRA pixels of the size asked;
 * false for a string that is not one. `punch` scales the contrast, 1 as
 * the reference does.
 */
bool DecodeBlurhash(std::string const &hash, int width, int height, std::vector<uint8_t> &bgra, float punch = 1.0f);

/** Encodes BGRA pixels as a blurhash with the components asked (1–9 each). */
std::string EncodeBlurhash(uint8_t const *bgra, int width, int height, int componentsX, int componentsY);

} // namespace ExpoWindows::ImageCache

#include "pch.h"

#include "Common.h"

namespace ExpoWindows {

namespace {

struct WindowSearch {
  DWORD process;
  HWND found;
};

BOOL CALLBACK FindMainWindow(HWND window, LPARAM parameter) noexcept {
  auto &search = *reinterpret_cast<WindowSearch *>(parameter);
  DWORD process = 0;
  GetWindowThreadProcessId(window, &process);
  if (process != search.process || !IsWindowVisible(window) || GetWindow(window, GW_OWNER) != nullptr) {
    return TRUE;
  }
  search.found = window;
  return FALSE;
}

} // namespace

std::filesystem::path AppDataFolder() {
  PWSTR local = nullptr;
  winrt::check_hresult(SHGetKnownFolderPath(FOLDERID_LocalAppData, 0, nullptr, &local));
  std::filesystem::path directory(local);
  CoTaskMemFree(local);
  wchar_t exe[MAX_PATH]{};
  GetModuleFileNameW(nullptr, exe, MAX_PATH);
  return directory / std::filesystem::path(exe).stem();
}

std::filesystem::path CachePath(wchar_t const *folder) {
  auto path = AppDataFolder() / L"cache" / folder;
  std::filesystem::create_directories(path);
  return path;
}

std::wstring NewFileName(wchar_t const *extension) {
  GUID guid{};
  CoCreateGuid(&guid);
  wchar_t text[40]{};
  StringFromGUID2(guid, text, 40);
  std::wstring name(text + 1, text + 37);
  return name + extension;
}

std::string FileUri(std::filesystem::path const &path) {
  std::string out = "file:///";
  for (unsigned char c : ToUtf8(path.wstring())) {
    if (c == '\\') {
      out += '/';
    } else if (std::isalnum(c) || c == '/' || c == ':' || c == '-' || c == '_' || c == '.' || c == '~') {
      out += static_cast<char>(c);
    } else {
      char escaped[4];
      std::snprintf(escaped, sizeof(escaped), "%%%02X", c);
      out += escaped;
    }
  }
  return out;
}

HWND MainWindow() noexcept {
  WindowSearch search{GetCurrentProcessId(), nullptr};
  EnumWindows(FindMainWindow, reinterpret_cast<LPARAM>(&search));
  return search.found;
}

std::wstring ToWide(std::string_view utf8) noexcept {
  try {
    return std::wstring{winrt::to_hstring(utf8)};
  } catch (...) {
    return {};
  }
}

std::string ToUtf8(std::wstring_view wide) noexcept {
  try {
    return winrt::to_string(wide);
  } catch (...) {
    return {};
  }
}

std::wstring PathFromUri(std::string_view uri) noexcept {
  const auto wide = ToWide(uri);
  if (wide.rfind(L"file:", 0) == 0) {
    try {
      winrt::Windows::Foundation::Uri parsed{wide};
      std::wstring path{winrt::Windows::Foundation::Uri::UnescapeComponent(parsed.Path())};
      if (!path.empty() && path.front() == L'/') path.erase(0, 1);
      std::replace(path.begin(), path.end(), L'/', L'\\');
      return path;
    } catch (...) {
      return {};
    }
  }
  if (wide.find(L"://") != std::wstring::npos) return {};
  return wide;
}

std::string Message(winrt::hresult_error const &error) noexcept {
  return ToUtf8(error.message());
}

} // namespace ExpoWindows

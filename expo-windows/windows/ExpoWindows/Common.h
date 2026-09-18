#pragma once

#include "pch.h"

/**
 * What the runtime's modules share: the app's window, string conversions,
 * and the path a `file:` URI names.
 */
namespace ExpoWindows {

/** The app's main window: the first visible, unowned top-level window of this process; null before it exists. */
HWND MainWindow() noexcept;

/** The app's own folder in the user's local data: `%LOCALAPPDATA%\<the exe's name>`. Throws when the shell cannot say. */
std::filesystem::path AppDataFolder();

/** `%LOCALAPPDATA%\<the exe's name>\cache\<folder>`, created. */
std::filesystem::path CachePath(wchar_t const *folder);

/** A name no file has yet, from a GUID, with the extension given (`.jpg`). */
std::wstring NewFileName(wchar_t const *extension);

/** `file:///C:/…` for a path, with forward slashes and the characters a URI cannot carry percent-encoded. */
std::string FileUri(std::filesystem::path const &path);

std::wstring ToWide(std::string_view utf8) noexcept;
std::string ToUtf8(std::wstring_view wide) noexcept;

/**
 * The file path a `file:` URI names (unescaped, with backslashes), the
 * string itself when it is a path already, and empty for a URI of any other
 * scheme.
 */
std::wstring PathFromUri(std::string_view uri) noexcept;

/** The message of a WinRT error, for a rejected promise. */
std::string Message(winrt::hresult_error const &error) noexcept;

} // namespace ExpoWindows

#pragma once

#include "pch.h"

namespace ExpoWindows::Media {

/** The player the media module made under `id`, for the video view to show; null when there is none. */
winrt::Windows::Media::Playback::MediaPlayer PlayerFor(int32_t id) noexcept;

} // namespace ExpoWindows::Media

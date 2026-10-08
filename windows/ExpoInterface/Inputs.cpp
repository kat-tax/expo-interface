#include "pch.h"

#include "Inputs.h"

#ifdef RNW_NEW_ARCH

#include "XamlHost.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceColorPicker.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceComboBox.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceDateFlyout.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceDatePicker.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceNumberBox.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceSelectorBar.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceSlider.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceTextBox.g.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceTimePicker.g.h"

namespace winrt::ExpoInterface {

namespace {

using DateTime = winrt::Windows::Foundation::DateTime;
using TimeSpan = winrt::Windows::Foundation::TimeSpan;

/** The zone the app runs in, with each year's daylight saving rules where Windows has them. */
DYNAMIC_TIME_ZONE_INFORMATION LocalZone() noexcept {
  DYNAMIC_TIME_ZONE_INFORMATION zone{};
  GetDynamicTimeZoneInformation(&zone);
  return zone;
}

/**
 * `YYYY-MM-DD` in local time, at noon so no zone shifts the day. It goes
 * through `SYSTEMTIME`, which holds every day from 1601, where `mktime`
 * refuses every day before 1970.
 */
std::optional<DateTime> DateFromString(const std::string &text) noexcept {
  int year = 0, month = 0, day = 0;
  if (sscanf_s(text.c_str(), "%d-%d-%d", &year, &month, &day) != 3) return std::nullopt;
  if (year < 1601 || year > 30827 || month < 1 || month > 12 || day < 1 || day > 31) return std::nullopt;
  SYSTEMTIME local{};
  local.wYear = static_cast<WORD>(year);
  local.wMonth = static_cast<WORD>(month);
  local.wDay = static_cast<WORD>(day);
  local.wHour = 12;
  const auto zone = LocalZone();
  SYSTEMTIME utc{};
  FILETIME file{};
  if (!TzSpecificLocalTimeToSystemTimeEx(&zone, &local, &utc) || !SystemTimeToFileTime(&utc, &file)) return std::nullopt;
  return winrt::clock::from_file_time(file);
}

/** A date's local day as `YYYY-MM-DD`; empty for one `SYSTEMTIME` cannot hold, which the kit ignores. */
std::string DateToString(DateTime date) noexcept {
  const FILETIME file = winrt::clock::to_file_time(date);
  const auto zone = LocalZone();
  SYSTEMTIME utc{};
  SYSTEMTIME local{};
  if (!FileTimeToSystemTime(&file, &utc) || !SystemTimeToTzSpecificLocalTimeEx(&zone, &utc, &local)) return "";
  char buffer[16];
  snprintf(buffer, sizeof buffer, "%04d-%02d-%02d", local.wYear, local.wMonth, local.wDay);
  return buffer;
}

/**
 * A bound the kit sent as `YYYY-MM-DD`. One in a year `SYSTEMTIME` does not
 * hold moves to the nearest day it does, so a bound before 1601 opens the
 * calendar as far as Windows goes rather than falling back to the default
 * range. The first day is the 2nd of January 1601, the first whose local noon
 * every zone can hold. Empty when no bound was sent.
 */
std::optional<DateTime> BoundFromString(const std::string &text) noexcept {
  int year = 0, month = 0, day = 0;
  if (sscanf_s(text.c_str(), "%d-%d-%d", &year, &month, &day) != 3) return std::nullopt;
  if (year < 1601) return DateFromString("1601-01-02");
  if (year > 30827) return DateFromString("30827-12-30");
  return DateFromString(text);
}

/**
 * The calendar's first day: the kit's bound or, where it sent none,
 * 1900-01-01, or the value when it is earlier. WinUI moves a value outside
 * the range onto its nearest bound, and the change it raises can reach the
 * kit as a pick.
 */
std::optional<DateTime> FirstDay(const std::string &bound, const std::optional<DateTime> &date) noexcept {
  if (auto day = BoundFromString(bound)) return day;
  auto floor = DateFromString("1900-01-01");
  if (date && floor && *date < *floor) return date;
  return floor;
}

/** The calendar's last day: the kit's bound or, where it sent none, 2100-12-31, or the value when it is later. */
std::optional<DateTime> LastDay(const std::string &bound, const std::optional<DateTime> &date) noexcept {
  if (auto day = BoundFromString(bound)) return day;
  auto ceiling = DateFromString("2100-12-31");
  if (date && ceiling && *ceiling < *date) return date;
  return ceiling;
}

std::optional<TimeSpan> TimeFromString(const std::string &text) noexcept {
  int hours = 0, minutes = 0;
  if (sscanf_s(text.c_str(), "%d:%d", &hours, &minutes) != 2) return std::nullopt;
  return TimeSpan{std::chrono::hours(hours) + std::chrono::minutes(minutes)};
}

std::string TimeToString(TimeSpan time) noexcept {
  const auto total = std::chrono::duration_cast<std::chrono::minutes>(time).count();
  char buffer[8];
  snprintf(buffer, sizeof buffer, "%02d:%02d", static_cast<int>(total / 60), static_cast<int>(total % 60));
  return buffer;
}

// -- Slider ------------------------------------------------------------------

struct SliderView : winrt::implements<SliderView, winrt::IInspectable>,
                    Codegen::BaseExpoInterfaceSlider<SliderView>,
                    XamlIsland<SliderView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_slider = controls::Slider{};
    m_slider.IsThumbToolTipEnabled(true);
    m_slider.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
    m_slider.MinWidth(120);
    m_slider.ValueChanged([weak = get_weak()](const winrt::IInspectable &, const controls::Primitives::RangeBaseValueChangedEventArgs &args) {
      if (auto strong = weak.get()) {
        if (strong->m_applying) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceSliderEventEmitter::OnValueChange event;
          event.value = args.NewValue();
          emitter->onValueChange(std::move(event));
        }
      }
    });
    auto complete = [weak = get_weak()](const winrt::IInspectable &sender, const winrt::IInspectable &) {
      if (auto strong = weak.get()) {
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceSliderEventEmitter::OnSlidingComplete event;
          event.value = sender.as<controls::Slider>().Value();
          emitter->onSlidingComplete(std::move(event));
        }
      }
    };
    m_slider.PointerCaptureLost([complete](const winrt::IInspectable &sender, const xaml::Input::PointerRoutedEventArgs &) { complete(sender, nullptr); });
    m_slider.KeyUp([complete](const winrt::IInspectable &sender, const xaml::Input::KeyRoutedEventArgs &) { complete(sender, nullptr); });
    Attach(islandView, m_slider);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceSliderProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceSliderProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceSlider<SliderView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->color ? props->color : props->accentColor);
    const double min = props->min.value_or(0.0);
    const double max = props->max > min ? props->max : min + 1;
    const double step = props->step.value_or(0.0);
    m_slider.Minimum(min);
    m_slider.Maximum(max);
    // Continuous: a thousandth of the range, so a drag reads smoothly.
    m_slider.StepFrequency(step > 0 ? step : (max - min) / 1000);
    m_slider.Value(std::min(max, std::max(min, props->value)));
    m_slider.IsEnabled(!props->disabled.value_or(false));
    SetIdentity(m_slider, props->label, props->ViewProps);
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::Slider m_slider{nullptr};
  bool m_applying{false};
};

// -- NumberBox ---------------------------------------------------------------

struct NumberBoxView : winrt::implements<NumberBoxView, winrt::IInspectable>,
                       Codegen::BaseExpoInterfaceNumberBox<NumberBoxView>,
                       XamlIsland<NumberBoxView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_box = controls::NumberBox{};
    m_box.SpinButtonPlacementMode(controls::NumberBoxSpinButtonPlacementMode::Inline);
    m_box.MinWidth(120);
    m_box.ValueChanged([weak = get_weak()](const controls::NumberBox &, const controls::NumberBoxValueChangedEventArgs &args) {
      if (auto strong = weak.get()) {
        if (strong->m_applying || std::isnan(args.NewValue())) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceNumberBoxEventEmitter::OnValueChange event;
          event.value = args.NewValue();
          emitter->onValueChange(std::move(event));
        }
      }
    });
    Attach(islandView, m_box);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceNumberBoxProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceNumberBoxProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceNumberBox<NumberBoxView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    const double infinity = std::numeric_limits<double>::infinity();
    m_box.Minimum(props->hasMin.value_or(false) ? props->min.value_or(0.0) : -infinity);
    m_box.Maximum(props->hasMax.value_or(false) ? props->max.value_or(0.0) : infinity);
    m_box.SmallChange(props->step > 0 ? props->step : 1);
    m_box.LargeChange((props->step > 0 ? props->step : 1) * 10);
    if (m_box.Value() != props->value) m_box.Value(props->value);
    m_box.IsEnabled(!props->disabled.value_or(false));
    SetIdentity(m_box, props->label, props->ViewProps);
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::NumberBox m_box{nullptr};
  bool m_applying{false};
};

// -- ComboBox ----------------------------------------------------------------

struct ComboBoxView : winrt::implements<ComboBoxView, winrt::IInspectable>,
                      Codegen::BaseExpoInterfaceComboBox<ComboBoxView>,
                      XamlIsland<ComboBoxView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_box = controls::ComboBox{};
    m_box.MinWidth(120);
    m_box.SelectionChanged([weak = get_weak()](const winrt::IInspectable &sender, const controls::SelectionChangedEventArgs &) {
      if (auto strong = weak.get()) {
        if (strong->m_applying) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceComboBoxEventEmitter::OnSelectionChange event;
          event.index = sender.as<controls::ComboBox>().SelectedIndex();
          if (event.index >= 0) emitter->onSelectionChange(std::move(event));
        }
      }
    });
    Attach(islandView, m_box);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceComboBoxProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceComboBoxProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceComboBox<ComboBoxView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    if (props->options != m_options) {
      m_options = props->options;
      m_box.Items().Clear();
      for (const auto &label : JsonStrings(ParseArray(m_options))) {
        m_box.Items().Append(winrt::box_value(ToHString(label)));
      }
    }
    const int32_t index = props->selectedIndex;
    if (m_box.SelectedIndex() != index) m_box.SelectedIndex(index < static_cast<int32_t>(m_box.Items().Size()) ? index : -1);
    m_box.PlaceholderText(ToHString(props->placeholder.value_or("")));
    m_box.IsEnabled(!props->disabled.value_or(false));
    SetIdentity(m_box, props->label, props->ViewProps);
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::ComboBox m_box{nullptr};
  std::string m_options;
  bool m_applying{false};
};

// -- SelectorBar -------------------------------------------------------------

struct SelectorBarView : winrt::implements<SelectorBarView, winrt::IInspectable>,
                         Codegen::BaseExpoInterfaceSelectorBar<SelectorBarView>,
                         XamlIsland<SelectorBarView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_bar = controls::SelectorBar{};
    m_bar.LayoutUpdated([weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) {
        strong->FitToItems();
      }
    });
    m_bar.SelectionChanged([weak = get_weak()](const controls::SelectorBar &sender, const controls::SelectorBarSelectionChangedEventArgs &) {
      if (auto strong = weak.get()) {
        if (strong->m_applying) return;
        auto selected = sender.SelectedItem();
        if (!selected) return;
        uint32_t index = 0;
        if (!sender.Items().IndexOf(selected, index)) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceSelectorBarEventEmitter::OnSelectionChange event;
          event.index = static_cast<int32_t>(index);
          emitter->onSelectionChange(std::move(event));
        }
      }
    });
    Attach(islandView, m_bar);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceSelectorBarProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceSelectorBarProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceSelectorBar<SelectorBarView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    if (props->options != m_options) {
      m_options = props->options;
      m_fitted = 0;
      m_bar.MinWidth(0);
      m_bar.Items().Clear();
      for (const auto &label : JsonStrings(ParseArray(m_options))) {
        controls::SelectorBarItem item;
        item.Text(ToHString(label));
        m_bar.Items().Append(item);
      }
    }
    const uint32_t index = static_cast<uint32_t>(std::max(0, props->selectedIndex.value_or(0)));
    if (index < m_bar.Items().Size() && m_bar.SelectedItem() != m_bar.Items().GetAt(index)) {
      m_bar.SelectedItem(m_bar.Items().GetAt(index));
    }
    m_bar.IsEnabled(!props->disabled.value_or(false));
    SetIdentity(m_bar, props->label, props->ViewProps);
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  /**
   * WinUI's SelectorBar asks for less width than its items take — its
   * ItemsView measures short of the last one — so an island that hugs it
   * clips the last label. Once the items are laid out, the right edge of the
   * last one is the width the bar needs: kept as its MinWidth, which makes
   * it report the full size, and reset when the items change.
   */
  void FitToItems() noexcept {
    try {
      const auto count = m_bar.Items().Size();
      if (count == 0) return;
      auto last = m_bar.Items().GetAt(count - 1).try_as<xaml::FrameworkElement>();
      if (!last || !last.IsLoaded()) return;
      const auto origin = last.TransformToVisual(m_bar).TransformPoint({0, 0});
      const double extent = std::max(last.ActualWidth(), static_cast<double>(last.DesiredSize().Width));
      const double width = origin.X + extent + m_bar.Padding().Right;
      if (width <= 0 || std::abs(width - m_fitted) < 0.5) return;
      m_fitted = width;
      m_bar.MinWidth(width);
      // The bar's new minimum does not reach the island's panel on its own:
      // measure it again so the size Yoga holds is reported.
      Root().InvalidateMeasure();
    } catch (...) {
    }
  }

  controls::SelectorBar m_bar{nullptr};
  std::string m_options;
  double m_fitted = 0;
  bool m_applying{false};
};

// -- CalendarDatePicker ------------------------------------------------------

struct DatePickerView : winrt::implements<DatePickerView, winrt::IInspectable>,
                        Codegen::BaseExpoInterfaceDatePicker<DatePickerView>,
                        XamlIsland<DatePickerView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_picker = controls::CalendarDatePicker{};
    m_picker.DateChanged([weak = get_weak()](const controls::CalendarDatePicker &, const controls::CalendarDatePickerDateChangedEventArgs &args) {
      if (auto strong = weak.get()) {
        if (strong->m_applying) return;
        auto date = args.NewDate();
        if (!date) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceDatePickerEventEmitter::OnDateChange event;
          event.date = DateToString(date.Value());
          emitter->onDateChange(std::move(event));
        }
      }
    });
    Attach(islandView, m_picker);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceDatePickerProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceDatePickerProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceDatePicker<DatePickerView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    const auto date = DateFromString(props->date.value_or(""));
    if (auto first = FirstDay(props->minDate.value_or(""), date)) m_picker.MinDate(*first);
    if (auto last = LastDay(props->maxDate.value_or(""), date)) m_picker.MaxDate(*last);
    if (date) {
      auto current = m_picker.Date();
      if (!current || DateToString(current.Value()) != DateToString(*date)) m_picker.Date(*date);
    } else {
      m_picker.Date(nullptr);
    }
    m_picker.PlaceholderText(ToHString(props->placeholder.value_or("")));
    m_picker.IsEnabled(!props->disabled.value_or(false));
    SetIdentity(m_picker, props->label, props->ViewProps);
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::CalendarDatePicker m_picker{nullptr};
  bool m_applying{false};
};

// -- DateFlyout (the presented picker) --------------------------------------

/**
 * A day in a `CalendarView` held by a `Flyout`, or a time in a
 * `TimePickerFlyout`, shown from an empty anchor at a point. A pick is
 * reported and the flyout stays up until the kit closes it through `open`;
 * a new `mode` while it is open closes one flyout and shows the other from
 * the first one's `Closed`, with no close reported.
 */
struct DateFlyoutView : winrt::implements<DateFlyoutView, winrt::IInspectable>,
                        Codegen::BaseExpoInterfaceDateFlyout<DateFlyoutView>,
                        XamlIsland<DateFlyoutView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_anchor = controls::Grid{};
    m_anchor.IsHitTestVisible(false);
    m_anchor.Background(nullptr);
    m_calendar = controls::CalendarView{};
    m_calendar.SelectionMode(controls::CalendarViewSelectionMode::Single);
    m_calendar.SelectedDatesChanged([weak = get_weak()](const controls::CalendarView &, const controls::CalendarViewSelectedDatesChangedEventArgs &args) {
      if (auto strong = weak.get()) {
        if (strong->m_applying || args.AddedDates().Size() == 0) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceDateFlyoutEventEmitter::OnDateChange event;
          event.date = DateToString(args.AddedDates().GetAt(0));
          emitter->onDateChange(std::move(event));
        }
      }
    });
    m_dateFlyout = controls::Flyout{};
    m_dateFlyout.Content(m_calendar);
    m_timeFlyout = controls::TimePickerFlyout{};
    m_timeFlyout.MinuteIncrement(1);
    m_timeFlyout.TimePicked([weak = get_weak()](const controls::TimePickerFlyout &, const controls::TimePickedEventArgs &args) {
      if (auto strong = weak.get()) {
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceDateFlyoutEventEmitter::OnTimeChange event;
          event.time = TimeToString(args.NewTime());
          emitter->onTimeChange(std::move(event));
        }
      }
    });
    auto closed = [weak = get_weak()](const winrt::IInspectable &, const winrt::IInspectable &) {
      if (auto strong = weak.get()) strong->OnClosed();
    };
    m_dateFlyout.Closed(closed);
    m_timeFlyout.Closed(closed);
    Attach(islandView, m_anchor);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceDateFlyoutProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceDateFlyoutProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceDateFlyout<DateFlyoutView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    // The calendar lives in a popup, outside the island's tree: it takes the
    // scheme and the accent from the island by hand.
    m_calendar.RequestedTheme(Root().RequestedTheme());
    ApplyAccent(m_calendar, props->accentColor);
    const auto date = DateFromString(props->date.value_or(""));
    if (auto first = FirstDay(props->minDate.value_or(""), date)) m_calendar.MinDate(*first);
    if (auto last = LastDay(props->maxDate.value_or(""), date)) m_calendar.MaxDate(*last);
    if (date) {
      m_calendar.SelectedDates().Clear();
      m_calendar.SelectedDates().Append(*date);
      m_calendar.SetDisplayDate(*date);
    }
    if (auto time = TimeFromString(props->time.value_or(""))) m_timeFlyout.Time(*time);
    m_applying = false;
    const bool time = props->mode.value_or("date") == "time";
    if (props->open && !m_open) {
      if (!m_switching) Show(time);
    } else if (!props->open && m_open) {
      Current().Hide();
    } else if (props->open && m_open && time != m_time) {
      m_switching = true;
      Current().Hide();
    }
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::Primitives::FlyoutBase Current() const noexcept {
    if (m_time) return m_timeFlyout;
    return m_dateFlyout;
  }

  void Show(bool time) noexcept {
    if (!m_anchor.XamlRoot()) {
      // Not in the tree yet: shown once it is.
      m_anchor.Loaded([weak = get_weak()](const winrt::IInspectable &, const xaml::RoutedEventArgs &) {
        if (auto strong = weak.get()) {
          if (auto props = strong->Props(); props && props->open && !strong->m_open) strong->Show(props->mode.value_or("date") == "time");
        }
      });
      return;
    }
    auto props = Props();
    if (!props) return;
    m_open = true;
    m_time = time;
    controls::Primitives::FlyoutShowOptions options;
    options.Position(winrt::Windows::Foundation::Point{static_cast<float>(props->x.value_or(0.0)), static_cast<float>(props->y.value_or(0.0))});
    options.Placement(controls::Primitives::FlyoutPlacementMode::BottomEdgeAlignedLeft);
    Current().ShowAt(m_anchor, options);
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceDateFlyoutEventEmitter::OnOpenChange event;
      event.open = true;
      emitter->onOpenChange(std::move(event));
    }
  }

  void OnClosed() noexcept {
    m_open = false;
    // Closed to swap the calendar for the time, or back: show the other.
    if (m_switching) {
      m_switching = false;
      if (auto props = Props(); props && props->open) Show(props->mode.value_or("date") == "time");
      return;
    }
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceDateFlyoutEventEmitter::OnOpenChange event;
      event.open = false;
      emitter->onOpenChange(std::move(event));
    }
  }

  controls::Grid m_anchor{nullptr};
  controls::CalendarView m_calendar{nullptr};
  controls::Flyout m_dateFlyout{nullptr};
  controls::TimePickerFlyout m_timeFlyout{nullptr};
  bool m_applying{false};
  bool m_open{false};
  bool m_time{false};
  bool m_switching{false};
};

// -- TimePicker --------------------------------------------------------------

struct TimePickerView : winrt::implements<TimePickerView, winrt::IInspectable>,
                        Codegen::BaseExpoInterfaceTimePicker<TimePickerView>,
                        XamlIsland<TimePickerView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_picker = controls::TimePicker{};
    m_picker.MinuteIncrement(1);
    m_picker.SelectedTimeChanged([weak = get_weak()](const controls::TimePicker &, const controls::TimePickerSelectedValueChangedEventArgs &args) {
      if (auto strong = weak.get()) {
        if (strong->m_applying) return;
        auto time = args.NewTime();
        if (!time) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceTimePickerEventEmitter::OnTimeChange event;
          event.time = TimeToString(time.Value());
          emitter->onTimeChange(std::move(event));
        }
      }
    });
    Attach(islandView, m_picker);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceTimePickerProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceTimePickerProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceTimePicker<TimePickerView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    if (auto time = TimeFromString(props->time)) {
      auto current = m_picker.SelectedTime();
      if (!current || current.Value() != *time) m_picker.SelectedTime(*time);
    }
    m_picker.IsEnabled(!props->disabled.value_or(false));
    SetIdentity(m_picker, props->label, props->ViewProps);
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::TimePicker m_picker{nullptr};
  bool m_applying{false};
};

// -- TextBox -----------------------------------------------------------------

struct TextBoxView : winrt::implements<TextBoxView, winrt::IInspectable>,
                     Codegen::BaseExpoInterfaceTextBox<TextBoxView>,
                     XamlIsland<TextBoxView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_root = controls::Grid{};
    Attach(islandView, m_root);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceTextBoxProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceTextBoxProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceTextBox<TextBoxView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    const bool password = props->password.value_or(false);
    if (password != m_password || (!m_text && !m_secret)) {
      Build(password);
    }
    const auto text = ToHString(props->value);
    if (m_text) {
      if (m_text.Text() != text) m_text.Text(text);
      m_text.PlaceholderText(ToHString(props->placeholder.value_or("")));
      m_text.MaxLength(props->maxLength.value_or(0));
      m_text.AcceptsReturn(props->multiline.value_or(false));
      m_text.TextWrapping(props->multiline.value_or(false) ? xaml::TextWrapping::Wrap : xaml::TextWrapping::NoWrap);
      m_text.MinHeight(props->multiline.value_or(false) ? 80 : 0);
      m_text.IsSpellCheckEnabled(props->spellCheck.value_or(true));
      m_text.InputScope(ScopeFor(props->inputScope.value_or("default")));
      m_text.IsEnabled(!props->disabled.value_or(false));
      SetIdentity(m_text, props->label ? props->label : props->placeholder, props->ViewProps);
      Chrome(m_text, props->borderless.value_or(false));
    }
    if (m_secret) {
      if (m_secret.Password() != text) m_secret.Password(text);
      m_secret.PlaceholderText(ToHString(props->placeholder.value_or("")));
      m_secret.MaxLength(props->maxLength.value_or(0));
      m_secret.IsEnabled(!props->disabled.value_or(false));
      SetIdentity(m_secret, props->label ? props->label : props->placeholder, props->ViewProps);
      Chrome(m_secret, props->borderless.value_or(false));
    }
    if (props->autoFocus.value_or(false) && !m_focused) {
      m_focused = true;
      Control().Loaded([](const winrt::IInspectable &sender, const xaml::RoutedEventArgs &) {
        sender.as<controls::Control>().Focus(xaml::FocusState::Programmatic);
      });
    }
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  controls::Control Control() const noexcept {
    return m_text ? controls::Control{m_text} : controls::Control{m_secret};
  }

  void Build(bool password) noexcept {
    m_root.Children().Clear();
    m_text = nullptr;
    m_secret = nullptr;
    m_password = password;
    if (password) {
      m_secret = controls::PasswordBox{};
      m_secret.PasswordChanged([weak = get_weak()](const winrt::IInspectable &sender, const xaml::RoutedEventArgs &) {
        if (auto strong = weak.get()) strong->Changed(ToUtf8(sender.as<controls::PasswordBox>().Password()));
      });
      m_secret.KeyDown([weak = get_weak()](const winrt::IInspectable &sender, const xaml::Input::KeyRoutedEventArgs &args) {
        if (auto strong = weak.get()) strong->Key(args, ToUtf8(sender.as<controls::PasswordBox>().Password()), false);
      });
      m_root.Children().Append(m_secret);
    } else {
      m_text = controls::TextBox{};
      m_text.TextChanged([weak = get_weak()](const winrt::IInspectable &sender, const controls::TextChangedEventArgs &) {
        if (auto strong = weak.get()) strong->Changed(ToUtf8(sender.as<controls::TextBox>().Text()));
      });
      m_text.KeyDown([weak = get_weak()](const winrt::IInspectable &sender, const xaml::Input::KeyRoutedEventArgs &args) {
        if (auto strong = weak.get()) {
          auto box = sender.as<controls::TextBox>();
          strong->Key(args, ToUtf8(box.Text()), box.AcceptsReturn());
        }
      });
      m_root.Children().Append(m_text);
    }
    Control().HorizontalAlignment(xaml::HorizontalAlignment::Stretch);
  }

  void Changed(std::string text) noexcept {
    if (m_applying) return;
    if (auto emitter = EventEmitter()) {
      Codegen::ExpoInterfaceTextBoxEventEmitter::OnChangeText event;
      event.text = std::move(text);
      emitter->onChangeText(std::move(event));
    }
  }

  void Key(const xaml::Input::KeyRoutedEventArgs &args, std::string text, bool multiline) noexcept {
    auto emitter = EventEmitter();
    if (!emitter) return;
    const bool shift = ShiftDown();
    Codegen::ExpoInterfaceTextBoxEventEmitter::OnKeyPress key;
    key.key = KeyName(args.Key());
    key.shiftKey = shift;
    emitter->onKeyPress(std::move(key));
    if (args.Key() == winrt::Windows::System::VirtualKey::Enter && !shift && !multiline) {
      Codegen::ExpoInterfaceTextBoxEventEmitter::OnSubmit submit;
      submit.text = std::move(text);
      emitter->onSubmit(std::move(submit));
    }
  }

  /** Strips the box's chrome for a form row: no fill, no border, in any state. */
  static void Chrome(const controls::Control &control, bool borderless) noexcept {
    if (!borderless) return;
    auto resources = control.Resources();
    for (auto key : {L"TextControlBackground", L"TextControlBackgroundPointerOver", L"TextControlBackgroundFocused", L"TextControlBackgroundDisabled",
                     L"TextControlBorderBrush", L"TextControlBorderBrushPointerOver", L"TextControlBorderBrushFocused", L"TextControlBorderBrushDisabled"}) {
      resources.Insert(winrt::box_value(key), Brush(Color{0, 0, 0, 0}));
    }
    control.BorderThickness({0, 0, 0, 0});
    control.Padding({0, 4, 0, 4});
    control.MinHeight(0);
  }

  static xaml::Input::InputScope ScopeFor(const std::string &scope) noexcept {
    using Value = xaml::Input::InputScopeNameValue;
    Value value = Value::Default;
    if (scope == "email") value = Value::EmailSmtpAddress;
    else if (scope == "number") value = Value::Number;
    else if (scope == "phone") value = Value::TelephoneNumber;
    else if (scope == "decimal") value = Value::Number;
    else if (scope == "url") value = Value::Url;
    xaml::Input::InputScope inputScope;
    xaml::Input::InputScopeName name;
    name.NameValue(value);
    inputScope.Names().Append(name);
    return inputScope;
  }

  controls::Grid m_root{nullptr};
  controls::TextBox m_text{nullptr};
  controls::PasswordBox m_secret{nullptr};
  bool m_password{false};
  bool m_applying{false};
  bool m_focused{false};
};

// -- ColorPicker -------------------------------------------------------------

struct ColorPickerView : winrt::implements<ColorPickerView, winrt::IInspectable>,
                         Codegen::BaseExpoInterfaceColorPicker<ColorPickerView>,
                         XamlIsland<ColorPickerView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_well = controls::Button{};
    m_well.Width(32);
    m_well.Height(32);
    m_well.Padding({0, 0, 0, 0});
    m_well.CornerRadius(xaml::CornerRadius{16, 16, 16, 16});
    m_swatch = winrt::Microsoft::UI::Xaml::Shapes::Ellipse{};
    m_swatch.Width(22);
    m_swatch.Height(22);
    m_well.Content(m_swatch);
    m_picker = controls::ColorPicker{};
    m_picker.IsMoreButtonVisible(true);
    m_picker.IsHexInputVisible(true);
    m_picker.ColorSpectrumShape(controls::ColorSpectrumShape::Ring);
    m_picker.ColorChanged([weak = get_weak()](const controls::ColorPicker &, const controls::ColorChangedEventArgs &args) {
      if (auto strong = weak.get()) {
        strong->m_swatch.Fill(Brush(args.NewColor()));
        if (strong->m_applying) return;
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceColorPickerEventEmitter::OnValueChange event;
          event.value = ToHex(args.NewColor(), true);
          emitter->onValueChange(std::move(event));
        }
      }
    });
    m_flyout = controls::Flyout{};
    m_well.Flyout(m_flyout);
    // The island holds the well, whose flyout holds the picker, or the picker itself (`inPlace`).
    m_root = controls::Grid{};
    Place();
    Attach(islandView, m_root);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceColorPickerProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceColorPickerProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceColorPicker<ColorPickerView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    m_applying = true;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    m_picker.IsAlphaEnabled(props->alpha.value_or(true));
    Color color;
    if (TryParseColor(props->value, color)) {
      if (m_picker.Color() != color) m_picker.Color(color);
      m_swatch.Fill(Brush(color));
    }
    m_well.IsEnabled(!props->disabled.value_or(false));
    m_picker.IsEnabled(!props->disabled.value_or(false));
    SetIdentity(m_well, props->label, props->ViewProps);
    const bool inPlace = props->inPlace.value_or(false);
    if (inPlace != m_inPlace) {
      m_inPlace = inPlace;
      Place();
      // The island takes the picker's size, or the well's again, in this turn.
      Remeasure();
    }
    m_applying = false;
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  /** Puts the picker where it belongs: in the island in place of the well, or in the well's flyout. */
  void Place() noexcept {
    m_root.Children().Clear();
    if (m_inPlace) {
      m_flyout.Content(nullptr);
      m_root.Children().Append(m_picker);
    } else {
      m_root.Children().Append(m_well);
      m_flyout.Content(m_picker);
    }
  }

  controls::Grid m_root{nullptr};
  controls::Button m_well{nullptr};
  controls::Flyout m_flyout{nullptr};
  winrt::Microsoft::UI::Xaml::Shapes::Ellipse m_swatch{nullptr};
  controls::ColorPicker m_picker{nullptr};
  bool m_inPlace{false};
  bool m_applying{false};
};

} // namespace

void RegisterInputs(rn::IReactPackageBuilder const &packageBuilder) noexcept {
  RegisterIsland<SliderView>(packageBuilder, &Codegen::RegisterExpoInterfaceSliderNativeComponent<SliderView>);
  RegisterIsland<NumberBoxView>(packageBuilder, &Codegen::RegisterExpoInterfaceNumberBoxNativeComponent<NumberBoxView>);
  RegisterIsland<ComboBoxView>(packageBuilder, &Codegen::RegisterExpoInterfaceComboBoxNativeComponent<ComboBoxView>);
  RegisterIsland<SelectorBarView>(packageBuilder, &Codegen::RegisterExpoInterfaceSelectorBarNativeComponent<SelectorBarView>);
  RegisterIsland<DatePickerView>(packageBuilder, &Codegen::RegisterExpoInterfaceDatePickerNativeComponent<DatePickerView>);
  RegisterIsland<TimePickerView>(packageBuilder, &Codegen::RegisterExpoInterfaceTimePickerNativeComponent<TimePickerView>);
  RegisterIsland<DateFlyoutView>(packageBuilder, &Codegen::RegisterExpoInterfaceDateFlyoutNativeComponent<DateFlyoutView>);
  RegisterIsland<TextBoxView>(packageBuilder, &Codegen::RegisterExpoInterfaceTextBoxNativeComponent<TextBoxView>);
  RegisterIsland<ColorPickerView>(packageBuilder, &Codegen::RegisterExpoInterfaceColorPickerNativeComponent<ColorPickerView>);
}

} // namespace winrt::ExpoInterface

#else

namespace winrt::ExpoInterface {
void RegisterInputs(winrt::Microsoft::ReactNative::IReactPackageBuilder const &) noexcept {}
} // namespace winrt::ExpoInterface

#endif // RNW_NEW_ARCH

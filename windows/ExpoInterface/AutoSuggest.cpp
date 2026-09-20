#include "pch.h"

#include "AutoSuggest.h"

#ifdef RNW_NEW_ARCH

#include "XamlHost.h"
#include "codegen/react/components/ExpoInterfaceSpec/ExpoInterfaceAutoSuggestBox.g.h"

#include <winrt/Windows.Foundation.Collections.h>

namespace winrt::ExpoInterface {

namespace {

/**
 * The Windows search field: a WinUI 3 `AutoSuggestBox`, which draws the query
 * box, its clear button, and the suggestion list the system places and sizes.
 *
 * The kit owns the text, as it does for every other input, so the control
 * follows a prop rather than holding its own state. `TextChanged` reports a
 * reason, and only `UserInput` is passed on — a change the kit made would
 * otherwise come straight back as if a person had typed it, and the two would
 * fight each other on every keystroke.
 */
struct AutoSuggestBoxView : winrt::implements<AutoSuggestBoxView, winrt::IInspectable>,
                            Codegen::BaseExpoInterfaceAutoSuggestBox<AutoSuggestBoxView>,
                            XamlIsland<AutoSuggestBoxView> {
  void InitializeIsland(const composition::ContentIslandComponentView &islandView) noexcept {
    m_box = controls::AutoSuggestBox{};
    m_box.QueryIcon(MakeGlyph("E721", 16));
    m_box.HorizontalAlignment(xaml::HorizontalAlignment::Stretch);

    m_box.TextChanged([weak = get_weak()](
                          const controls::AutoSuggestBox &sender,
                          const controls::AutoSuggestBoxTextChangedEventArgs &args) {
      // Only what a person typed. A programmatic change is the kit's own prop
      // arriving back, and reporting it would loop.
      if (args.Reason() != controls::AutoSuggestionBoxTextChangeReason::UserInput) return;
      if (auto strong = weak.get()) {
        strong->Suggest(ToUtf8(sender.Text()));
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceAutoSuggestBoxEventEmitter::OnTextChange event;
          event.text = ToUtf8(sender.Text());
          emitter->onTextChange(std::move(event));
        }
      }
    });

    m_box.QuerySubmitted([weak = get_weak()](
                             const controls::AutoSuggestBox &sender,
                             const controls::AutoSuggestBoxQuerySubmittedEventArgs &args) {
      if (auto strong = weak.get()) {
        // A suggestion taken from the list arrives as the chosen item; Enter
        // in the box arrives as the query text.
        auto chosen = args.ChosenSuggestion();
        const auto text = chosen ? ToUtf8(winrt::unbox_value_or<winrt::hstring>(chosen, {})) : ToUtf8(args.QueryText());
        if (auto emitter = strong->EventEmitter()) {
          Codegen::ExpoInterfaceAutoSuggestBoxEventEmitter::OnSubmit event;
          event.text = text;
          emitter->onSubmit(std::move(event));
        }
        // The chosen text is also a change to the field, which the kit owns.
        if (chosen) {
          if (auto emitter = strong->EventEmitter()) {
            Codegen::ExpoInterfaceAutoSuggestBoxEventEmitter::OnTextChange change;
            change.text = text;
            emitter->onTextChange(std::move(change));
          }
        }
      }
    });

    Attach(islandView, m_box);
  }

  void UpdateProps(
      const rn::ComponentView &view,
      const winrt::com_ptr<Codegen::ExpoInterfaceAutoSuggestBoxProps> &newProps,
      const winrt::com_ptr<Codegen::ExpoInterfaceAutoSuggestBoxProps> &oldProps) noexcept override {
    Codegen::BaseExpoInterfaceAutoSuggestBox<AutoSuggestBoxView>::UpdateProps(view, newProps, oldProps);
    auto props = Props();
    if (!props) return;
    ApplyLook(props->ViewProps, props->theme, props->accentColor);
    const auto text = ToHString(props->text);
    if (m_box.Text() != text) m_box.Text(text);
    m_box.PlaceholderText(ToHString(props->placeholder.value_or("")));
    m_box.IsEnabled(!props->disabled.value_or(false));
    m_all = JsonStrings(ParseArray(props->suggestions));
    SetIdentity(m_box, props->placeholder, props->ViewProps);
  }

  void UpdateState(const rn::ComponentView &, const rn::IComponentState &newState) noexcept override {
    KeepState(newState);
  }

 private:
  /**
   * The completions that match what has been typed. The control draws and
   * places the list; which entries go in it is the app's business, and doing
   * the filtering here keeps it the same rule the other platforms use.
   */
  void Suggest(const std::string &query) noexcept {
    auto items = winrt::single_threaded_vector<winrt::IInspectable>();
    if (!query.empty()) {
      auto needle = query;
      std::transform(needle.begin(), needle.end(), needle.begin(), [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
      for (const auto &candidate : m_all) {
        auto lowered = candidate;
        std::transform(lowered.begin(), lowered.end(), lowered.begin(), [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
        if (lowered.find(needle) != std::string::npos) items.Append(winrt::box_value(ToHString(candidate)));
      }
    }
    m_box.ItemsSource(items);
  }

  controls::AutoSuggestBox m_box{nullptr};
  std::vector<std::string> m_all;
};

} // namespace

void RegisterAutoSuggest(rn::IReactPackageBuilder const &packageBuilder) noexcept {
  RegisterIsland<AutoSuggestBoxView>(packageBuilder, &Codegen::RegisterExpoInterfaceAutoSuggestBoxNativeComponent<AutoSuggestBoxView>);
}

} // namespace winrt::ExpoInterface

#endif // RNW_NEW_ARCH

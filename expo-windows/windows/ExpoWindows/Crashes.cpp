#include "pch.h"

#include "Common.h"

#include <NativeModules.h>
#include <dbghelp.h>

#pragma comment(lib, "dbghelp.lib")

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace ExpoWindows;

namespace fs = std::filesystem;

namespace {

/** `%LOCALAPPDATA%\<the exe's name>\crashes`, created. */
fs::path CrashFolder() {
  auto folder = AppDataFolder() / L"crashes";
  std::error_code ignored;
  fs::create_directories(folder, ignored);
  return folder;
}

/** A file stem that sorts by time: `20260918-141500-123`. */
std::wstring Stamp() {
  SYSTEMTIME time{};
  GetSystemTime(&time);
  wchar_t text[32]{};
  swprintf_s(text, L"%04u%02u%02u-%02u%02u%02u-%03u", time.wYear, time.wMonth, time.wDay, time.wHour, time.wMinute, time.wSecond, time.wMilliseconds);
  return text;
}

std::string IsoNow() {
  SYSTEMTIME time{};
  GetSystemTime(&time);
  char text[32]{};
  std::snprintf(text, sizeof(text), "%04u-%02u-%02uT%02u:%02u:%02u.%03uZ", time.wYear, time.wMonth, time.wDay, time.wHour, time.wMinute, time.wSecond, time.wMilliseconds);
  return text;
}

std::string JsonString(std::string_view text) {
  std::string out = "\"";
  for (unsigned char c : text) {
    switch (c) {
      case '"': out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n"; break;
      case '\r': out += "\\r"; break;
      case '\t': out += "\\t"; break;
      default:
        if (c < 0x20) {
          char buffer[8];
          std::snprintf(buffer, sizeof(buffer), "\\u%04x", c);
          out += buffer;
        } else {
          out += static_cast<char>(c);
        }
    }
  }
  return out + "\"";
}

void WriteText(fs::path const &file, std::string const &text) {
  std::ofstream out(file, std::ios::binary);
  out << text;
}

std::string ReportJson(std::string const &type, std::string const &message, std::string const &stack, std::string const &extra) {
  return "{\"type\":" + JsonString(type) + ",\"timestamp\":" + JsonString(IsoNow()) + ",\"message\":" + JsonString(message) +
      (stack.empty() ? "" : ",\"stack\":" + JsonString(stack)) + extra + "}";
}

std::atomic<bool> g_reported{false};

/**
 * A minidump of the faulting state and a report beside it; the exception
 * then goes on as before. Written once: a second fault is left alone.
 */
void Report(EXCEPTION_POINTERS *pointers) noexcept {
  if (g_reported.exchange(true)) return;
  try {
    auto folder = CrashFolder();
    auto stamp = Stamp();
    auto dumpFile = folder / (stamp + L".dmp");
    bool dumped = false;
    HANDLE file = CreateFileW(dumpFile.c_str(), GENERIC_WRITE, 0, nullptr, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
    if (file != INVALID_HANDLE_VALUE) {
      MINIDUMP_EXCEPTION_INFORMATION information{GetCurrentThreadId(), pointers, FALSE};
      auto kind = static_cast<MINIDUMP_TYPE>(MiniDumpWithIndirectlyReferencedMemory | MiniDumpWithThreadInfo | MiniDumpWithUnloadedModules);
      dumped = MiniDumpWriteDump(GetCurrentProcess(), GetCurrentProcessId(), file, kind, pointers ? &information : nullptr, nullptr, nullptr) != FALSE;
      CloseHandle(file);
    }
    DWORD code = pointers && pointers->ExceptionRecord ? pointers->ExceptionRecord->ExceptionCode : 0;
    void *address = pointers && pointers->ExceptionRecord ? pointers->ExceptionRecord->ExceptionAddress : nullptr;
    std::string module = "an unknown module";
    HMODULE handle = nullptr;
    if (address && GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS | GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT, static_cast<LPCWSTR>(address), &handle)) {
      wchar_t name[MAX_PATH]{};
      if (GetModuleFileNameW(handle, name, MAX_PATH) > 0) module = ToUtf8(fs::path(name).filename().wstring());
    }
    char message[320]{};
    std::snprintf(message, sizeof(message), "Unhandled exception 0x%08lX at %p in %s", static_cast<unsigned long>(code), address, module.c_str());
    std::string extra = ",\"code\":" + std::to_string(code) + (dumped ? ",\"dump\":" + JsonString(ToUtf8(dumpFile.wstring())) : "");
    WriteText(folder / (stamp + L".json"), ReportJson("native", message, "", extra));
  } catch (...) {
  }
}

/** The codes a process does not come back from: hardware faults, and the heap's own verdict. */
bool IsFatal(DWORD code) noexcept {
  switch (code) {
    case EXCEPTION_ACCESS_VIOLATION:
    case EXCEPTION_ARRAY_BOUNDS_EXCEEDED:
    case EXCEPTION_DATATYPE_MISALIGNMENT:
    case EXCEPTION_ILLEGAL_INSTRUCTION:
    case EXCEPTION_IN_PAGE_ERROR:
    case EXCEPTION_INT_DIVIDE_BY_ZERO:
    case EXCEPTION_NONCONTINUABLE_EXCEPTION:
    case EXCEPTION_PRIV_INSTRUCTION:
    case EXCEPTION_STACK_OVERFLOW:
    case STATUS_HEAP_CORRUPTION:
      return true;
    default:
      return false;
  }
}

/**
 * Sees every exception first, before any handler up the stack. A fault
 * the process will not survive is reported here, because the frameworks
 * between the fault and the top of the stack — the dispatcher a callback
 * runs on, XAML — end the process with a fail-fast on their way out, which
 * skips the unhandled exception filter. A C++ exception or a WinRT error
 * passes untouched: those are thrown to be caught.
 */
LONG WINAPI OnFirstChance(EXCEPTION_POINTERS *pointers) {
  if (pointers && pointers->ExceptionRecord && IsFatal(pointers->ExceptionRecord->ExceptionCode)) Report(pointers);
  return EXCEPTION_CONTINUE_SEARCH;
}

/** What reaches the top unhandled — an escaped C++ exception, say — is reported here if it was not above. */
LONG WINAPI OnUnhandledException(EXCEPTION_POINTERS *pointers) {
  Report(pointers);
  return EXCEPTION_CONTINUE_SEARCH;
}

} // namespace

/**
 * `ExpoWindowsCrashes`: what the app leaves behind when it dies, and reads
 * back at its next launch. A native unhandled exception writes a minidump
 * and a JSON report under `crashes` in the app's local data; a fatal
 * JavaScript error is recorded through `record` by the runtime's global
 * error handler; `getLastCrash` answers with the newest report and
 * `clearCrashes` removes them all. `crash` faults the process on purpose,
 * for a test of the road.
 */
REACT_MODULE(ExpoWindowsCrashes)
struct ExpoWindowsCrashes {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
    static std::once_flag once;
    std::call_once(once, []() {
      AddVectoredExceptionHandler(1, OnFirstChance);
      SetUnhandledExceptionFilter(OnUnhandledException);
    });
  }

  /** Writes a report of a JavaScript error now, before the instance goes down; whether it was written. */
  REACT_SYNC_METHOD(Record, L"record")
  bool Record(std::string type, std::string message, std::string stack) noexcept {
    try {
      WriteText(CrashFolder() / (Stamp() + L".json"), ReportJson(type, message, stack, ""));
      return true;
    } catch (...) {
      return false;
    }
  }

  /** The newest report's JSON, or null when there is none. */
  REACT_METHOD(GetLastCrash, L"getLastCrash")
  fire_and_forget GetLastCrash(ReactPromise<JSValue> promise) noexcept {
    co_await resume_background();
    try {
      std::error_code ignored;
      fs::path newest;
      for (auto const &entry : fs::directory_iterator(CrashFolder(), ignored)) {
        if (entry.path().extension() == L".json" && (newest.empty() || entry.path().filename() > newest.filename())) newest = entry.path();
      }
      if (newest.empty()) {
        promise.Resolve(JSValue{nullptr});
        co_return;
      }
      std::ifstream in(newest, std::ios::binary);
      std::string text((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
      promise.Resolve(JSValue{text});
    } catch (std::exception const &error) {
      promise.Reject(error.what());
    }
  }

  REACT_METHOD(ClearCrashes, L"clearCrashes")
  fire_and_forget ClearCrashes(ReactPromise<void> promise) noexcept {
    co_await resume_background();
    std::error_code ignored;
    for (auto const &entry : fs::directory_iterator(CrashFolder(), ignored)) fs::remove(entry.path(), ignored);
    promise.Resolve();
  }

  /** Faults the process on the UI thread: an access violation the filter above reports. */
  REACT_METHOD(Crash, L"crash")
  void Crash() noexcept {
    m_context.UIDispatcher().Post([]() {
      volatile int *nowhere = nullptr;
      *nowhere = 1;
    });
  }

 private:
  ReactContext m_context;
};

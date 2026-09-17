#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

#include <winsqlite/winsqlite3.h>

#include <cmath>
#include <map>
#include <memory>
#include <mutex>

#pragma comment(lib, "winsqlite3.lib")

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Security::Cryptography;
using namespace ExpoWindows;

namespace fs = std::filesystem;

namespace {

JSValue Ok(JSValue value) {
  return JSValueObject{{"value", std::move(value)}};
}

JSValue Fail(std::string message) {
  return JSValueObject{{"error", std::move(message)}};
}

std::string ToBase64(void const *data, int size) {
  if (!data || size <= 0) return {};
  auto bytes = static_cast<uint8_t const *>(data);
  return to_string(CryptographicBuffer::EncodeToBase64String(CryptographicBuffer::CreateFromByteArray(array_view<uint8_t const>(bytes, bytes + size))));
}

std::vector<uint8_t> FromBase64(std::string const &text) {
  if (text.empty()) return {};
  com_array<uint8_t> bytes;
  CryptographicBuffer::CopyToByteArray(CryptographicBuffer::DecodeFromBase64String(to_hstring(text)), bytes);
  return std::vector<uint8_t>(bytes.begin(), bytes.end());
}

/** A column's value as the package reads it: null, a number, text, or a blob as `{blob}` in base64 for the JavaScript to turn into bytes. */
JSValue Column(sqlite3_stmt *statement, int index) {
  switch (sqlite3_column_type(statement, index)) {
    case SQLITE_INTEGER: return JSValue(static_cast<double>(sqlite3_column_int64(statement, index)));
    case SQLITE_FLOAT: return JSValue(sqlite3_column_double(statement, index));
    case SQLITE_TEXT: return JSValue(std::string(reinterpret_cast<char const *>(sqlite3_column_text(statement, index)), static_cast<size_t>(sqlite3_column_bytes(statement, index))));
    case SQLITE_BLOB: return JSValueObject{{"blob", ToBase64(sqlite3_column_blob(statement, index), sqlite3_column_bytes(statement, index))}};
    default: return JSValue(nullptr);
  }
}

JSValueArray Row(sqlite3_stmt *statement) {
  JSValueArray row;
  const int count = sqlite3_column_count(statement);
  for (int index = 0; index < count; index++) row.push_back(Column(statement, index));
  return row;
}

/** The index of a parameter: by position for an array, else by name as given or with `:`, `@` or `$` before it, as the package tries them. */
int ParameterIndex(sqlite3_stmt *statement, std::string const &key, bool asArray) {
  if (asArray) return std::atoi(key.c_str()) + 1;
  if (int index = sqlite3_bind_parameter_index(statement, key.c_str())) return index;
  for (auto prefix : {":", "@", "$"}) {
    if (int index = sqlite3_bind_parameter_index(statement, (prefix + key).c_str())) return index;
  }
  return 0;
}

int BindValue(sqlite3_stmt *statement, int index, JSValue const &value) {
  switch (value.Type()) {
    case JSValueType::Null: return sqlite3_bind_null(statement, index);
    case JSValueType::Boolean: return sqlite3_bind_int(statement, index, value.AsBoolean() ? 1 : 0);
    case JSValueType::Int64: return sqlite3_bind_int64(statement, index, value.AsInt64());
    case JSValueType::Double: {
      const double number = value.AsDouble();
      if (std::floor(number) == number && std::fabs(number) < 9007199254740992.0) return sqlite3_bind_int64(statement, index, static_cast<sqlite3_int64>(number));
      return sqlite3_bind_double(statement, index, number);
    }
    case JSValueType::String: {
      auto const &text = value.AsString();
      return sqlite3_bind_text(statement, index, text.c_str(), static_cast<int>(text.size()), SQLITE_TRANSIENT);
    }
    default: return sqlite3_bind_null(statement, index);
  }
}

} // namespace

/**
 * `ExpoWindowsSQLite`: SQLite for `expo-sqlite`, the system's own
 * (`winsqlite3.dll`, which every Windows 10 and 11 has), by handles the
 * JavaScript keeps — a database opened by path, statements prepared on
 * it, bound, stepped, run and finalized, transactions asked after, the
 * backup and serialization APIs, an update hook as `onDatabaseChange` —
 * each answer `{value}` or `{error}` for the JavaScript to raise. The
 * database directory is the app's own in the user's local data.
 */
REACT_MODULE(ExpoWindowsSQLite)
struct ExpoWindowsSQLite {
  REACT_INIT(Initialize)
  void Initialize(ReactContext const &context) noexcept {
    m_context = context;
  }

  REACT_EVENT(OnDatabaseChange, L"onDatabaseChange")
  std::function<void(JSValue)> OnDatabaseChange;

  REACT_SYNC_METHOD(DefaultDirectory, L"defaultDirectory")
  std::string DefaultDirectory() noexcept {
    try {
      return (AppDataFolder() / L"SQLite").generic_string();
    } catch (...) {
      return "";
    }
  }

  REACT_SYNC_METHOD(EnsureDirectory, L"ensureDirectory")
  JSValue EnsureDirectory(std::string path) noexcept {
    try {
      fs::create_directories(fs::path(ToWide(path)).parent_path());
      return Ok(nullptr);
    } catch (std::exception const &error) {
      return Fail(error.what());
    }
  }

  REACT_SYNC_METHOD(FileExists, L"fileExists")
  bool FileExists(std::string path) noexcept {
    try {
      return fs::exists(fs::path(ToWide(path)));
    } catch (...) {
      return false;
    }
  }

  /** Removes the database file and its journal, WAL and shared-memory files. */
  REACT_SYNC_METHOD(DeleteDatabase, L"deleteDatabase")
  JSValue DeleteDatabase(std::string path) noexcept {
    try {
      fs::path file(ToWide(path));
      if (!fs::exists(file)) return Fail("Database '" + path + "' not found");
      fs::remove(file);
      for (auto suffix : {L"-journal", L"-wal", L"-shm"}) fs::remove(fs::path(file.wstring() + suffix));
      return Ok(nullptr);
    } catch (std::exception const &error) {
      return Fail(error.what());
    }
  }

  REACT_SYNC_METHOD(Open, L"open")
  JSValue Open(std::string path) noexcept {
    sqlite3 *database = nullptr;
    const int rc = sqlite3_open_v2(path.c_str(), &database, SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE, nullptr);
    if (rc != SQLITE_OK) {
      std::string message = database ? sqlite3_errmsg(database) : "Could not open the database";
      sqlite3_close_v2(database);
      return Fail(message);
    }
    std::lock_guard lock(m_mutex);
    const int id = m_nextId++;
    m_databases[id] = database;
    return Ok(id);
  }

  REACT_SYNC_METHOD(Close, L"close")
  JSValue Close(int id) noexcept {
    std::lock_guard lock(m_mutex);
    auto found = m_databases.find(id);
    if (found == m_databases.end()) return Fail("The database is closed");
    for (auto it = m_statements.begin(); it != m_statements.end();) {
      if (it->second.database == id) {
        sqlite3_finalize(it->second.statement);
        it = m_statements.erase(it);
      } else {
        ++it;
      }
    }
    m_hooks.erase(id);
    sqlite3_close_v2(found->second);
    m_databases.erase(found);
    return Ok(nullptr);
  }

  REACT_SYNC_METHOD(Exec, L"exec")
  JSValue Exec(int id, std::string sql) noexcept {
    auto database = Database(id);
    if (!database) return Fail("The database is closed");
    char *message = nullptr;
    if (sqlite3_exec(database, sql.c_str(), nullptr, nullptr, &message) != SQLITE_OK) {
      std::string text = message ? message : "The statement failed";
      sqlite3_free(message);
      return Fail(text);
    }
    return Ok(nullptr);
  }

  REACT_SYNC_METHOD(InTransaction, L"inTransaction")
  JSValue InTransaction(int id) noexcept {
    auto database = Database(id);
    if (!database) return Fail("The database is closed");
    return Ok(sqlite3_get_autocommit(database) == 0);
  }

  REACT_SYNC_METHOD(Prepare, L"prepare")
  JSValue Prepare(int id, std::string sql) noexcept {
    auto database = Database(id);
    if (!database) return Fail("The database is closed");
    sqlite3_stmt *statement = nullptr;
    if (sqlite3_prepare_v2(database, sql.c_str(), -1, &statement, nullptr) != SQLITE_OK || !statement) {
      return Fail(sqlite3_errmsg(database));
    }
    std::lock_guard lock(m_mutex);
    const int statementId = m_nextId++;
    m_statements[statementId] = {statement, id};
    return Ok(statementId);
  }

  /** Binds the parameters — primitives, and blobs given in base64 — by position for an array, else by name. */
  REACT_SYNC_METHOD(Bind, L"bind")
  JSValue Bind(int statementId, JSValueObject params, JSValueObject blobs, bool asArray) noexcept {
    auto entry = Statement(statementId);
    if (!entry.statement) return Fail("The statement is finalized");
    sqlite3_reset(entry.statement);
    sqlite3_clear_bindings(entry.statement);
    for (auto const &[key, value] : params) {
      const int index = ParameterIndex(entry.statement, key, asArray);
      if (index <= 0) continue;
      if (BindValue(entry.statement, index, value) != SQLITE_OK) return Fail(std::string("Could not bind parameter ") + key);
    }
    for (auto const &[key, value] : blobs) {
      const int index = ParameterIndex(entry.statement, key, asArray);
      if (index <= 0) continue;
      auto bytes = FromBase64(value.AsString());
      if (sqlite3_bind_blob(entry.statement, index, bytes.data(), static_cast<int>(bytes.size()), SQLITE_TRANSIENT) != SQLITE_OK) {
        return Fail(std::string("Could not bind parameter ") + key);
      }
    }
    return Ok(nullptr);
  }

  /** One step: the row's values, null when done. */
  REACT_SYNC_METHOD(Step, L"step")
  JSValue Step(int statementId) noexcept {
    auto entry = Statement(statementId);
    if (!entry.statement) return Fail("The statement is finalized");
    const int rc = sqlite3_step(entry.statement);
    if (rc == SQLITE_ROW) return Ok(Row(entry.statement));
    if (rc == SQLITE_DONE) return Ok(nullptr);
    return Fail(sqlite3_errmsg(Database(entry.database)));
  }

  REACT_SYNC_METHOD(All, L"all")
  JSValue All(int statementId) noexcept {
    auto entry = Statement(statementId);
    if (!entry.statement) return Fail("The statement is finalized");
    JSValueArray rows;
    int rc;
    while ((rc = sqlite3_step(entry.statement)) == SQLITE_ROW) rows.push_back(Row(entry.statement));
    if (rc != SQLITE_DONE) return Fail(sqlite3_errmsg(Database(entry.database)));
    return Ok(std::move(rows));
  }

  /** Runs the statement to the end: the last inserted row id, the changes, and the first row's values. */
  REACT_SYNC_METHOD(Run, L"run")
  JSValue Run(int statementId) noexcept {
    auto entry = Statement(statementId);
    if (!entry.statement) return Fail("The statement is finalized");
    auto database = Database(entry.database);
    JSValueArray first;
    int rc = sqlite3_step(entry.statement);
    if (rc == SQLITE_ROW) {
      first = Row(entry.statement);
      while ((rc = sqlite3_step(entry.statement)) == SQLITE_ROW) {
      }
    }
    if (rc != SQLITE_DONE) return Fail(sqlite3_errmsg(database));
    JSValueObject result{
        {"lastInsertRowId", static_cast<double>(sqlite3_last_insert_rowid(database))},
        {"changes", sqlite3_changes(database)},
        {"firstRowValues", std::move(first)},
    };
    sqlite3_reset(entry.statement);
    return Ok(std::move(result));
  }

  REACT_SYNC_METHOD(Reset, L"reset")
  JSValue Reset(int statementId) noexcept {
    auto entry = Statement(statementId);
    if (!entry.statement) return Fail("The statement is finalized");
    sqlite3_reset(entry.statement);
    return Ok(nullptr);
  }

  REACT_SYNC_METHOD(Columns, L"columns")
  JSValue Columns(int statementId) noexcept {
    auto entry = Statement(statementId);
    if (!entry.statement) return Fail("The statement is finalized");
    JSValueArray names;
    const int count = sqlite3_column_count(entry.statement);
    for (int index = 0; index < count; index++) names.push_back(sqlite3_column_name(entry.statement, index));
    return Ok(std::move(names));
  }

  REACT_SYNC_METHOD(Finalize, L"finalize")
  JSValue Finalize(int statementId) noexcept {
    std::lock_guard lock(m_mutex);
    auto found = m_statements.find(statementId);
    if (found == m_statements.end()) return Fail("The statement is finalized");
    sqlite3_finalize(found->second.statement);
    m_statements.erase(found);
    return Ok(nullptr);
  }

  REACT_SYNC_METHOD(Backup, L"backup")
  JSValue Backup(int destinationId, std::string destinationName, int sourceId, std::string sourceName) noexcept {
    auto destination = Database(destinationId);
    auto source = Database(sourceId);
    if (!destination || !source) return Fail("The database is closed");
    auto backup = sqlite3_backup_init(destination, destinationName.c_str(), source, sourceName.c_str());
    if (!backup) return Fail(sqlite3_errmsg(destination));
    sqlite3_backup_step(backup, -1);
    if (sqlite3_backup_finish(backup) != SQLITE_OK) return Fail(sqlite3_errmsg(destination));
    return Ok(nullptr);
  }

  REACT_SYNC_METHOD(Serialize, L"serialize")
  JSValue Serialize(int id, std::string schema) noexcept {
    auto database = Database(id);
    if (!database) return Fail("The database is closed");
    sqlite3_int64 size = 0;
    auto data = sqlite3_serialize(database, schema.c_str(), &size, 0);
    if (!data) return Fail("The database could not be serialized");
    auto base64 = ToBase64(data, static_cast<int>(size));
    sqlite3_free(data);
    return Ok(std::move(base64));
  }

  REACT_SYNC_METHOD(Deserialize, L"deserialize")
  JSValue Deserialize(int id, std::string schema, std::string base64) noexcept {
    auto database = Database(id);
    if (!database) return Fail("The database is closed");
    auto bytes = FromBase64(base64);
    auto buffer = static_cast<uint8_t *>(sqlite3_malloc64(bytes.size()));
    if (!buffer) return Fail("Out of memory");
    std::copy(bytes.begin(), bytes.end(), buffer);
    const auto size = static_cast<sqlite3_int64>(bytes.size());
    if (sqlite3_deserialize(database, schema.c_str(), buffer, size, size, SQLITE_DESERIALIZE_FREEONCLOSE | SQLITE_DESERIALIZE_RESIZEABLE) != SQLITE_OK) {
      return Fail(sqlite3_errmsg(database));
    }
    return Ok(nullptr);
  }

  /** Sends `onDatabaseChange` for every insert, update and delete on the database. */
  REACT_SYNC_METHOD(WatchChanges, L"watchChanges")
  JSValue WatchChanges(int id, std::string name, std::string path) noexcept {
    auto database = Database(id);
    if (!database) return Fail("The database is closed");
    auto hook = std::make_unique<Hook>(Hook{this, std::move(name), std::move(path)});
    sqlite3_update_hook(database, &ExpoWindowsSQLite::Changed, hook.get());
    std::lock_guard lock(m_mutex);
    m_hooks[id] = std::move(hook);
    return Ok(nullptr);
  }

  REACT_SYNC_METHOD(LoadExtension, L"loadExtension")
  JSValue LoadExtension(int id, std::string path, std::string entry) noexcept {
    auto database = Database(id);
    if (!database) return Fail("The database is closed");
    sqlite3_enable_load_extension(database, 1);
    char *message = nullptr;
    if (sqlite3_load_extension(database, path.c_str(), entry.empty() ? nullptr : entry.c_str(), &message) != SQLITE_OK) {
      std::string text = message ? message : "The extension could not be loaded";
      sqlite3_free(message);
      return Fail(text);
    }
    return Ok(nullptr);
  }

 private:
  struct Entry {
    sqlite3_stmt *statement = nullptr;
    int database = 0;
  };
  struct Hook {
    ExpoWindowsSQLite *module;
    std::string name;
    std::string path;
  };

  static void Changed(void *context, int, char const *, char const *table, sqlite3_int64 rowId) noexcept {
    auto hook = static_cast<Hook *>(context);
    try {
      hook->module->OnDatabaseChange(JSValueObject{
          {"databaseName", hook->name},
          {"databaseFilePath", hook->path},
          {"tableName", table ? table : ""},
          {"rowId", static_cast<double>(rowId)},
      });
    } catch (...) {
    }
  }

  sqlite3 *Database(int id) noexcept {
    std::lock_guard lock(m_mutex);
    auto found = m_databases.find(id);
    return found == m_databases.end() ? nullptr : found->second;
  }

  Entry Statement(int id) noexcept {
    std::lock_guard lock(m_mutex);
    auto found = m_statements.find(id);
    return found == m_statements.end() ? Entry{} : found->second;
  }

  ReactContext m_context;
  std::mutex m_mutex;
  int m_nextId = 1;
  std::map<int, sqlite3 *> m_databases;
  std::map<int, Entry> m_statements;
  std::map<int, std::unique_ptr<Hook>> m_hooks;
};

#include "pch.h"

#include "Common.h"

#include <NativeModules.h>

using namespace winrt;
using namespace winrt::Microsoft::ReactNative;
using namespace winrt::Windows::Security::Cryptography;
using namespace winrt::Windows::Security::Cryptography::Core;
using namespace winrt::Windows::Storage::Streams;
using namespace ExpoWindows;

namespace {

/** The bytes a base64 string holds; an empty string is an empty buffer, which the decoder refuses. */
IBuffer FromBase64(std::string const &base64) {
  if (base64.empty()) return CryptographicBuffer::CreateFromByteArray(array_view<uint8_t const>{});
  return CryptographicBuffer::DecodeFromBase64String(to_hstring(base64));
}

std::string ToBase64(IBuffer const &buffer) {
  return to_string(CryptographicBuffer::EncodeToBase64String(buffer));
}

/** The provider's name for the algorithm `expo-crypto` names; MD2 and MD4 are Apple's. */
hstring HashName(std::string const &algorithm) {
  if (algorithm == "MD5") return HashAlgorithmNames::Md5();
  if (algorithm == "SHA-1") return HashAlgorithmNames::Sha1();
  if (algorithm == "SHA-256") return HashAlgorithmNames::Sha256();
  if (algorithm == "SHA-384") return HashAlgorithmNames::Sha384();
  if (algorithm == "SHA-512") return HashAlgorithmNames::Sha512();
  throw hresult_invalid_argument(L"The digest algorithm " + to_hstring(algorithm) + L" is not available on Windows");
}

/** A synchronous method cannot reject: it answers with the value, or with the error. */
JSValueObject Value(std::string value) {
  return JSValueObject{{"value", std::move(value)}};
}

JSValueObject Failure(hresult_error const &error) {
  return JSValueObject{{"error", Message(error)}};
}

CryptographicKey AesKey(std::string const &keyBase64) {
  return SymmetricKeyAlgorithmProvider::OpenAlgorithm(SymmetricAlgorithmNames::AesGcm()).CreateSymmetricKey(FromBase64(keyBase64));
}

IBuffer Optional(std::string const &base64) {
  return base64.empty() ? IBuffer{nullptr} : FromBase64(base64);
}

} // namespace

/**
 * `ExpoWindowsCrypto`: what `expo-crypto` hashes, draws random bytes and
 * runs AES-GCM through — the system's cryptography (`HashAlgorithmProvider`,
 * `CryptographicBuffer.GenerateRandom`, `CryptographicEngine`'s
 * authenticated encryption). Bytes cross the bridge as base64. The digest
 * and the random bytes are synchronous, as the package's own calls are;
 * the cipher is not.
 */
REACT_MODULE(ExpoWindowsCrypto)
struct ExpoWindowsCrypto {
  REACT_SYNC_METHOD(Digest, L"digest")
  JSValue Digest(std::string algorithm, std::string dataBase64) noexcept {
    try {
      return Value(ToBase64(HashAlgorithmProvider::OpenAlgorithm(HashName(algorithm)).HashData(FromBase64(dataBase64))));
    } catch (hresult_error const &error) {
      return Failure(error);
    }
  }

  REACT_SYNC_METHOD(RandomBytes, L"randomBytes")
  JSValue RandomBytes(int count) noexcept {
    try {
      return Value(count > 0 ? ToBase64(CryptographicBuffer::GenerateRandom(static_cast<uint32_t>(count))) : std::string{});
    } catch (hresult_error const &error) {
      return Failure(error);
    }
  }

  REACT_METHOD(AesGcmEncrypt, L"aesGcmEncrypt")
  void AesGcmEncrypt(std::string key, std::string iv, std::string plaintext, std::string aad, ReactPromise<JSValue> promise) noexcept {
    try {
      auto sealed = CryptographicEngine::EncryptAndAuthenticate(AesKey(key), FromBase64(plaintext), FromBase64(iv), Optional(aad));
      promise.Resolve(JSValueObject{{"ciphertext", ToBase64(sealed.EncryptedData())}, {"tag", ToBase64(sealed.AuthenticationTag())}});
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }

  REACT_METHOD(AesGcmDecrypt, L"aesGcmDecrypt")
  void AesGcmDecrypt(std::string key, std::string iv, std::string ciphertext, std::string tag, std::string aad, ReactPromise<std::string> promise) noexcept {
    try {
      auto plaintext = CryptographicEngine::DecryptAndAuthenticate(AesKey(key), FromBase64(ciphertext), FromBase64(iv), FromBase64(tag), Optional(aad));
      promise.Resolve(ToBase64(plaintext));
    } catch (hresult_error const &error) {
      promise.Reject(Message(error).c_str());
    }
  }
};

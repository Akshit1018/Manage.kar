enum MicPermission {
  granted,
  denied,
  permanentlyDenied,
  restricted,
  limited,
  unknown,
}

enum VoiceMicAction {
  requestOrRecord,
  explainDenied,
  offerSettings,
  unsupported,
}

/// Decides what the voice bowl may do after a tap. Never auto-opens Settings.
VoiceMicAction decideVoiceMicAction({
  required bool nativeDevice,
  required MicPermission permission,
}) {
  if (!nativeDevice) {
    return VoiceMicAction.unsupported;
  }
  switch (permission) {
    case MicPermission.granted:
    case MicPermission.limited:
      return VoiceMicAction.requestOrRecord;
    case MicPermission.denied:
    case MicPermission.unknown:
      return VoiceMicAction.requestOrRecord;
    case MicPermission.permanentlyDenied:
    case MicPermission.restricted:
      return VoiceMicAction.offerSettings;
  }
}

VoiceMicAction decideAfterRequest(MicPermission permission) {
  switch (permission) {
    case MicPermission.granted:
    case MicPermission.limited:
      return VoiceMicAction.requestOrRecord;
    case MicPermission.denied:
    case MicPermission.unknown:
      return VoiceMicAction.explainDenied;
    case MicPermission.permanentlyDenied:
    case MicPermission.restricted:
      return VoiceMicAction.offerSettings;
  }
}

import 'dart:async';
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/theme.dart';
import '../../../../core/errors/app_exception.dart';
import '../../data/vehicle_media_repository.dart';

class VehicleMediaPage extends ConsumerStatefulWidget {
  const VehicleMediaPage({
    required this.vehicleId,
    this.initialMedia = const [],
    super.key,
  });
  final String vehicleId;
  final List<Map<String, dynamic>> initialMedia;

  @override
  ConsumerState<VehicleMediaPage> createState() => _VehicleMediaPageState();
}

class _PreparedPhoto {
  _PreparedPhoto(this.bytes, this.width, this.height);
  final Uint8List bytes;
  final int width;
  final int height;
  double progress = 0;
  bool uploading = false;
  String? error;
}

class _VehicleMediaPageState extends ConsumerState<VehicleMediaPage> {
  late final List<Map<String, dynamic>> _remote = [...widget.initialMedia];
  final List<_PreparedPhoto> _pending = [];
  bool _selecting = false;
  bool _savingOrder = false;
  String? _message;

  int get _count => _remote.length + _pending.length;

  Future<void> _select() async {
    if (_selecting || _count >= vehicleMediaMaxCount) return;
    setState(() {
      _selecting = true;
      _message = null;
    });
    try {
      final files = await ImagePicker().pickMultiImage(
        imageQuality: 100,
        limit: vehicleMediaMaxCount - _count,
      );
      for (final file in files) {
        final original = await file.readAsBytes();
        if (original.length > vehicleMediaMaxOriginalBytes) {
          throw Exception(
            'One photo is larger than the 20 MB selection limit.',
          );
        }
        if (!isSupportedVehicleImage(original)) {
          throw Exception(
            'Only valid JPEG, PNG, or WebP photos are supported.',
          );
        }
        final optimized = await FlutterImageCompress.compressWithList(
          original,
          minWidth: 1920,
          minHeight: 1080,
          quality: 86,
          format: CompressFormat.jpeg,
          keepExif: false,
        );
        if (optimized.isEmpty ||
            optimized.length > vehicleMediaMaxUploadBytes) {
          throw Exception('A photo could not be optimized below 6 MB.');
        }
        final image = await _decode(optimized);
        _pending.add(_PreparedPhoto(optimized, image.width, image.height));
      }
    } catch (error) {
      _message = userFacingError(error);
    } finally {
      if (mounted) setState(() => _selecting = false);
    }
  }

  Future<ui.Image> _decode(Uint8List bytes) {
    final completer = Completer<ui.Image>();
    ui.decodeImageFromList(bytes, completer.complete);
    return completer.future;
  }

  Future<void> _upload(_PreparedPhoto photo) async {
    if (photo.uploading) return;
    setState(() {
      photo.uploading = true;
      photo.error = null;
      photo.progress = 0;
    });
    try {
      final media = await ref
          .read(vehicleMediaRepositoryProvider)
          .upload(
            vehicleId: widget.vehicleId,
            bytes: photo.bytes,
            width: photo.width,
            height: photo.height,
            onProgress: (sent, total) {
              if (mounted && total > 0) {
                setState(() => photo.progress = sent / total);
              }
            },
          );
      if (!mounted) return;
      setState(() {
        _pending.remove(photo);
        _remote.add(media);
      });
    } catch (_) {
      if (mounted) setState(() => photo.error = 'Upload failed. Tap retry.');
    } finally {
      if (mounted) setState(() => photo.uploading = false);
    }
  }

  Future<void> _deleteRemote(Map<String, dynamic> media) async {
    final id = media['id']?.toString() ?? '';
    if (id.isEmpty) return;
    try {
      await ref.read(vehicleMediaRepositoryProvider).delete(id);
      if (mounted) setState(() => _remote.remove(media));
    } catch (_) {
      if (mounted) {
        setState(() => _message = 'Photo could not be removed. Try again.');
      }
    }
  }

  Future<void> _moveToCover(int index) async {
    if (index == 0 || _savingOrder) return;
    final previous = [..._remote];
    setState(() {
      _savingOrder = true;
      final ordered = moveMediaToCover(_remote, index);
      _remote
        ..clear()
        ..addAll(ordered);
    });
    try {
      await ref
          .read(vehicleMediaRepositoryProvider)
          .reorder(
            widget.vehicleId,
            _remote.map((m) => m['id'].toString()).toList(),
          );
      if (mounted) {
        HapticFeedback.selectionClick();
        setState(() => _message = 'Cover photo updated.');
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _remote
            ..clear()
            ..addAll(previous);
          _message = 'Cover photo could not be changed.';
        });
      }
    } finally {
      if (mounted) setState(() => _savingOrder = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Vehicle photos')),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
      children: [
        Text(
          'Make the first impression count',
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Text(
          'Add up to 10 clear photos. The first uploaded photo is the cover; choose “Make cover” anytime.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 20),
        Semantics(
          button: true,
          label: 'Add vehicle photos, $_count of $vehicleMediaMaxCount used',
          child: OutlinedButton.icon(
            onPressed: _selecting || _count >= vehicleMediaMaxCount
                ? null
                : _select,
            icon: _selecting
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.add_photo_alternate_outlined),
            label: Text(
              _count >= vehicleMediaMaxCount
                  ? '10-photo limit reached'
                  : 'Choose photos  ·  $_count/10',
            ),
          ),
        ),
        if (_message != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Semantics(
              liveRegion: true,
              child: Text(
                _message!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ),
          ),
        const SizedBox(height: 20),
        if (_count == 0) const _EmptyMedia(),
        ..._remote.asMap().entries.map(
          (entry) => _RemoteTile(
            key: ValueKey(entry.value['id']),
            media: entry.value,
            index: entry.key,
            busy: _savingOrder,
            onCover: () => _moveToCover(entry.key),
            onDelete: () => _deleteRemote(entry.value),
          ),
        ),
        ..._pending.map(
          (photo) => _PendingTile(
            key: ObjectKey(photo),
            photo: photo,
            onUpload: () => _upload(photo),
            onRemove: () => setState(() => _pending.remove(photo)),
          ),
        ),
        if (_pending.isNotEmpty) ...[
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: _pending.any((p) => p.uploading)
                ? null
                : () async {
                    for (final photo in [..._pending]) {
                      await _upload(photo);
                    }
                  },
            icon: const Icon(Icons.cloud_upload_outlined),
            label: Text(
              'Upload ${_pending.length} selected photo${_pending.length == 1 ? '' : 's'}',
            ),
          ),
        ],
      ],
    ),
  );
}

class _EmptyMedia extends StatelessWidget {
  const _EmptyMedia();
  @override
  Widget build(BuildContext context) => Container(
    height: 220,
    decoration: BoxDecoration(
      color: GariLinkColors.neutral100,
      borderRadius: GariLinkRadius.cardBorderRadius,
    ),
    child: const Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.directions_car_filled_outlined,
          size: 54,
          color: GariLinkColors.textMuted,
        ),
        SizedBox(height: 12),
        Text('No photos yet', style: TextStyle(fontWeight: FontWeight.w700)),
        SizedBox(height: 4),
        Text('Drafts can be saved without photos.'),
      ],
    ),
  );
}

class _RemoteTile extends StatelessWidget {
  const _RemoteTile({
    super.key,
    required this.media,
    required this.index,
    required this.busy,
    required this.onCover,
    required this.onDelete,
  });
  final Map<String, dynamic> media;
  final int index;
  final bool busy;
  final VoidCallback onCover;
  final VoidCallback onDelete;
  @override
  Widget build(BuildContext context) => Card(
    margin: const EdgeInsets.only(bottom: 14),
    clipBehavior: Clip.antiAlias,
    child: Row(
      children: [
        SizedBox(
          width: 126,
          height: 100,
          child: CachedNetworkImage(
            imageUrl: media['publicUrl']?.toString() ?? '',
            fit: BoxFit.cover,
            memCacheWidth: 320,
            placeholder: (_, _) => const ColoredBox(
              color: GariLinkColors.neutral100,
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            ),
            errorWidget: (_, _, _) => const ColoredBox(
              color: GariLinkColors.neutral100,
              child: Icon(Icons.broken_image_outlined),
            ),
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  index == 0 ? 'Cover photo' : 'Photo ${index + 1}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 4,
                  children: [
                    if (index != 0)
                      TextButton(
                        onPressed: busy ? null : onCover,
                        child: const Text('Make cover'),
                      ),
                    IconButton(
                      tooltip: 'Remove photo ${index + 1}',
                      onPressed: busy ? null : onDelete,
                      icon: const Icon(Icons.delete_outline),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class _PendingTile extends StatelessWidget {
  const _PendingTile({
    super.key,
    required this.photo,
    required this.onUpload,
    required this.onRemove,
  });
  final _PreparedPhoto photo;
  final VoidCallback onUpload;
  final VoidCallback onRemove;
  @override
  Widget build(BuildContext context) => Card(
    margin: const EdgeInsets.only(bottom: 14),
    clipBehavior: Clip.antiAlias,
    child: Row(
      children: [
        Image.memory(
          photo.bytes,
          width: 126,
          height: 100,
          fit: BoxFit.cover,
          cacheWidth: 400,
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  photo.error ??
                      (photo.uploading ? 'Uploading…' : 'Ready to upload'),
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: photo.error == null
                        ? null
                        : Theme.of(context).colorScheme.error,
                  ),
                ),
                const SizedBox(height: 8),
                if (photo.uploading)
                  LinearProgressIndicator(
                    value: photo.progress == 0 ? null : photo.progress,
                  )
                else
                  Row(
                    children: [
                      TextButton(
                        onPressed: onUpload,
                        child: Text(photo.error == null ? 'Upload' : 'Retry'),
                      ),
                      IconButton(
                        tooltip: 'Remove selected photo',
                        onPressed: onRemove,
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

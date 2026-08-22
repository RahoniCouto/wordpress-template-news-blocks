import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import './editor.scss';

const ALLOWED_MEDIA_TYPES = ['image'];

function getMediaImageUrl(media) {
  return (
    media?.media_details?.sizes?.large?.source_url ||
    media?.media_details?.sizes?.medium_large?.source_url ||
    media?.media_details?.sizes?.medium?.source_url ||
    media?.source_url ||
    ''
  );
}

export default function MediaOverrideControl({
  value = 0,
  fallbackMediaId = 0,
  onChange,
  className = '',
  imageClassName = '',
  placeholderLabel,
  placeholderHelp,
  changeImageLabel,
}) {
  const activeMediaId = value || fallbackMediaId || 0;
  const isUsingOverride = value > 0;

  const resolvedChangeImageLabel =
    changeImageLabel || __('Alterar imagem', 'wordpress-template-news-blocks');

  const resolvedPlaceholderLabel =
    placeholderLabel || __('Escolher imagem', 'wordpress-template-news-blocks');

  const resolvedPlaceholderHelp =
    placeholderHelp ||
    __(
      'A imagem será usada apenas neste bloco.',
      'wordpress-template-news-blocks',
    );

  const resolvedResetImageLabel = fallbackMediaId
    ? __('Usar imagem destacada da matéria', 'wordpress-template-news-blocks')
    : __('Remover imagem customizada', 'wordpress-template-news-blocks');

  const { media, isResolving } = useSelect(
    (select) => {
      if (!activeMediaId) {
        return {
          media: null,
          isResolving: false,
        };
      }

      const core = select(coreStore);

      return {
        media: core.getEntityRecord('root', 'media', activeMediaId),
        isResolving: core.isResolving('getEntityRecord', [
          'root',
          'media',
          activeMediaId,
        ]),
      };
    },
    [activeMediaId],
  );

  const imageUrl = getMediaImageUrl(media);

  const wrapperClassName = [
    'wtn-blocks-media-override-control',
    className,
    imageUrl ? 'wtn-blocks-media-override-control--has-image' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClassName}>
      <MediaUploadCheck>
        <MediaUpload
          allowedTypes={ALLOWED_MEDIA_TYPES}
          value={activeMediaId}
          onSelect={(mediaItem) => {
            onChange(mediaItem?.id ? Number(mediaItem.id) : 0);
          }}
          render={({ open }) => {
            if (isResolving && activeMediaId > 0) {
              return (
                <div className="wtn-blocks-media-override-control__loading">
                  <Spinner />
                </div>
              );
            }

            if (imageUrl) {
              return (
                <button
                  type="button"
                  className="wtn-blocks-media-override-control__trigger"
                  onClick={open}
                  aria-label={resolvedChangeImageLabel}
                >
                  <img
                    className={[
                      'wtn-blocks-media-override-control__image',
                      imageClassName,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    src={imageUrl}
                    alt={media?.alt_text || ''}
                  />

                  <span className="wtn-blocks-media-override-control__overlay">
                    {__('Alterar imagem', 'wordpress-template-news-blocks')}
                  </span>
                </button>
              );
            }

            return (
              <button
                type="button"
                className="wtn-blocks-media-override-control__placeholder"
                onClick={open}
                aria-label={resolvedPlaceholderLabel}
              >
                <span className="wtn-blocks-media-override-control__placeholder-title">
                  {__('Escolher imagem', 'wordpress-template-news-blocks')}
                </span>

                <span className="wtn-blocks-media-override-control__placeholder-help">
                  {resolvedPlaceholderHelp}
                </span>
              </button>
            );
          }}
        />
      </MediaUploadCheck>

      {isUsingOverride && (
        <button
          type="button"
          className="wtn-blocks-media-override-control__reset"
          aria-label={resolvedResetImageLabel}
          onClick={() => {
            onChange(0);
          }}
        >
          {fallbackMediaId
            ? __('Usar destacada', 'wordpress-template-news-blocks')
            : __('Remover imagem', 'wordpress-template-news-blocks')}
        </button>
      )}
    </div>
  );
}

import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Notice, PanelBody, Placeholder, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { dateI18n } from '@wordpress/date';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';

import EditorialTextOverrideControl from '../../components/editorial-text-override-control';
import PostPicker from '../../components/post-picker';
import usePreviousEditorialPostIds from '../../hooks/use-previous-editorial-post-ids';
import {
  getPostOverride,
  sanitizeEditorialText,
  updatePostOverrides,
} from '../../utils/editorial-post-overrides';

function getPostTitle(post) {
  if (!post?.title?.rendered) {
    return __('Matéria sem título', 'wordpress-template-news-blocks');
  }

  return decodeEntities(sanitizeEditorialText(post.title.rendered));
}

function getRelativeTimeLabel(dateString) {
  if (!dateString) {
    return '';
  }

  const postDate = new Date(dateString);

  if (Number.isNaN(postDate.getTime())) {
    return '';
  }

  const diffSeconds = Math.max(
    0,
    Math.floor((Date.now() - postDate.getTime()) / 1000),
  );

  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffMinutes < 1) {
    return __('agora', 'wordpress-template-news-blocks');
  }

  if (diffMinutes < 60) {
    return sprintf(
      /* translators: %d: quantidade de minutos desde a publicação. */
      _n(
        'há %d min',
        'há %d min',
        diffMinutes,
        'wordpress-template-news-blocks',
      ),
      diffMinutes,
    );
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return sprintf(
      /* translators: %d: quantidade de horas desde a publicação. */
      _n('há %d h', 'há %d h', diffHours, 'wordpress-template-news-blocks'),
      diffHours,
    );
  }

  return dateI18n('j M • H\\hi', dateString);
}

export default function Edit({ attributes, setAttributes, clientId }) {
  const {
    postId = 0,
    postOverrides = {},
    label = 'Breaking News',
  } = attributes;

  const normalizedPostId = Number(postId) || 0;

  const normalizedPostOverrides =
    postOverrides &&
    typeof postOverrides === 'object' &&
    !Array.isArray(postOverrides)
      ? postOverrides
      : {};

  const previousEditorialPostIds = usePreviousEditorialPostIds(clientId);

  const hasPostConflict =
    normalizedPostId > 0 && previousEditorialPostIds.includes(normalizedPostId);

  const { selectedPost, isResolvingPost } = useSelect(
    (select) => {
      const core = select(coreStore);

      return {
        selectedPost: normalizedPostId
          ? core.getEntityRecord('postType', 'post', normalizedPostId)
          : null,
        isResolvingPost: normalizedPostId
          ? core.isResolving('getEntityRecord', [
              'postType',
              'post',
              normalizedPostId,
            ])
          : false,
      };
    },
    [normalizedPostId],
  );

  const blockProps = useBlockProps({
    className: 'wtn-blocks-breaking-news',
  });

  const handlePostChange = (nextPostId) => {
    const normalizedNextPostId = Number(nextPostId) || 0;

    setAttributes({
      postId: normalizedNextPostId,
    });
  };

  const inspectorControls = (
    <InspectorControls>
      <PanelBody
        title={__('Matéria', 'wordpress-template-news-blocks')}
        initialOpen
      >
        <PostPicker
          label={__(
            'Matéria do Breaking News',
            'wordpress-template-news-blocks',
          )}
          value={normalizedPostId}
          excludePostIds={previousEditorialPostIds}
          onChange={handlePostChange}
        />

        {hasPostConflict && (
          <Notice status="warning" isDismissible={false}>
            {__(
              'Esta matéria já é utilizada por um bloco editorial anterior. No frontend, este Breaking News não será exibido enquanto houver o conflito.',
              'wordpress-template-news-blocks',
            )}
          </Notice>
        )}
      </PanelBody>

      <PanelBody
        title={__('Ajuda', 'wordpress-template-news-blocks')}
        initialOpen={false}
      >
        <p className="wtn-blocks-breaking-news__inspector-help">
          {__(
            'Edite o label e a headline diretamente na prévia do bloco. O link e o tempo vêm da matéria selecionada.',
            'wordpress-template-news-blocks',
          )}
        </p>

        <p className="wtn-blocks-breaking-news__inspector-help">
          {__(
            'No frontend, a headline participa da hierarquia automática: o primeiro bloco editorial principal usa H1; os demais usam H2.',
            'wordpress-template-news-blocks',
          )}
        </p>
      </PanelBody>
    </InspectorControls>
  );

  if (!normalizedPostId) {
    return (
      <>
        {inspectorControls}

        <div {...blockProps}>
          <Placeholder
            icon="warning"
            label={__('Breaking News', 'wordpress-template-news-blocks')}
            instructions={__(
              'Selecione manualmente a matéria que será exibida na barra de urgência.',
              'wordpress-template-news-blocks',
            )}
          >
            <PostPicker
              label={__(
                'Matéria do Breaking News',
                'wordpress-template-news-blocks',
              )}
              value={normalizedPostId}
              excludePostIds={previousEditorialPostIds}
              onChange={handlePostChange}
            />
          </Placeholder>
        </div>
      </>
    );
  }

  if (isResolvingPost && !selectedPost) {
    return (
      <>
        {inspectorControls}

        <div {...blockProps}>
          <div className="wtn-blocks-breaking-news__editor-loading">
            <Spinner />
          </div>
        </div>
      </>
    );
  }

  if (!selectedPost) {
    return (
      <>
        {inspectorControls}

        <div {...blockProps}>
          <Notice status="warning" isDismissible={false}>
            {__(
              'A matéria selecionada não foi encontrada ou não está disponível.',
              'wordpress-template-news-blocks',
            )}
          </Notice>
        </div>
      </>
    );
  }

  const currentPostOverride = getPostOverride(
    normalizedPostOverrides,
    normalizedPostId,
  );

  const fallbackTitle = getPostTitle(selectedPost);

  const formattedTime = selectedPost.date
    ? getRelativeTimeLabel(selectedPost.date)
    : '';

  const updateCurrentPostOverride = (nextPostOverride) => {
    setAttributes({
      postOverrides: updatePostOverrides(
        normalizedPostOverrides,
        normalizedPostId,
        nextPostOverride,
      ),
    });
  };

  return (
    <>
      {inspectorControls}

      <div {...blockProps}>
        <div className="wtn-blocks-breaking-news__inner">
          <div className="wtn-blocks-breaking-news__badge">
            <span className="wtn-blocks-breaking-news__icon" aria-hidden="true">
              ⚡
            </span>

            <EditorialTextOverrideControl
              tagName="span"
              className="wtn-blocks-breaking-news__label"
              value={label}
              fallbackValue={__(
                'Breaking News',
                'wordpress-template-news-blocks',
              )}
              onChange={(nextLabel) => {
                setAttributes({
                  label: nextLabel,
                });
              }}
              placeholder={__(
                'Breaking News',
                'wordpress-template-news-blocks',
              )}
            />
          </div>

          <div className="wtn-blocks-breaking-news__link">
            <EditorialTextOverrideControl
              tagName="div"
              className="wtn-blocks-breaking-news__headline"
              value={currentPostOverride.titleOverride}
              fallbackValue={fallbackTitle}
              onChange={(nextTitleOverride) => {
                updateCurrentPostOverride({
                  ...currentPostOverride,
                  titleOverride: nextTitleOverride,
                });
              }}
              placeholder={__(
                'Escreva a headline do Breaking News',
                'wordpress-template-news-blocks',
              )}
            />

            {formattedTime && (
              <span className="wtn-blocks-breaking-news__time">
                {formattedTime}
              </span>
            )}

            <span className="wtn-blocks-breaking-news__cta" aria-hidden="true">
              ›
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

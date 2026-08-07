import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	Placeholder,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { dateI18n } from '@wordpress/date';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';

import PostPicker from '../../components/post-picker';
import usePreviousEditorialPostIds from '../../hooks/use-previous-editorial-post-ids';

function stripTags(value = '') {
	return value.replace(/<[^>]*>/g, '').trim();
}

function getPostTitle(post) {
	if (!post?.title?.rendered) {
		return __('Matéria sem título', 'wordpress-template-news-blocks');
	}

	return decodeEntities(stripTags(post.title.rendered));
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
		Math.floor((Date.now() - postDate.getTime()) / 1000)
	);

	const diffMinutes = Math.floor(diffSeconds / 60);

	if (diffMinutes < 1) {
		return __('agora', 'wordpress-template-news-blocks');
	}

	if (diffMinutes < 60) {
		return sprintf(
			_n(
				'há %d min',
				'há %d min',
				diffMinutes,
				'wordpress-template-news-blocks'
			),
			diffMinutes
		);
	}

	const diffHours = Math.floor(diffMinutes / 60);

	if (diffHours < 24) {
		return sprintf(
			_n(
				'há %d h',
				'há %d h',
				diffHours,
				'wordpress-template-news-blocks'
			),
			diffHours
		);
	}

	return dateI18n('j M • H\\hi', dateString);
}

export default function Edit({
	attributes,
	setAttributes,
	clientId,
}) {
	const {
		postId = 0,
		titleOverride = '',
		label = 'Breaking News',
	} = attributes;

	const previousEditorialPostIds = usePreviousEditorialPostIds(clientId);

	const hasPostConflict = postId > 0 && previousEditorialPostIds.includes(Number(postId));

	const { selectedPost, isResolvingPost } = useSelect(
		(select) => {
			const core = select(coreStore);

			return {
				selectedPost: postId
					? core.getEntityRecord('postType', 'post', postId)
					: null,
				isResolvingPost: postId
					? core.isResolving('getEntityRecord', [
							'postType',
							'post',
							postId,
					  ])
					: false,
			};
		},
		[postId]
	);

	const fallbackTitle = getPostTitle(selectedPost);
	const previewTitle = titleOverride.trim() || fallbackTitle;
	const previewLabel =
		label.trim() || __('Breaking News', 'wordpress-template-news-blocks');

	const formattedTime = selectedPost?.date
		? getRelativeTimeLabel(selectedPost.date)
		: '';

	const blockProps = useBlockProps({
		className: 'wtn-blocks-breaking-news',
	});

	const inspectorControls = (
		<InspectorControls>
			<PanelBody
				title={__('Matéria', 'wordpress-template-news-blocks')}
				initialOpen
			>
				<PostPicker
					label={__('Matéria do Breaking News', 'wordpress-template-news-blocks')}
					value={postId}
					excludePostIds={previousEditorialPostIds}
					onChange={(nextPostId) => {
						setAttributes({
							postId: nextPostId,
							titleOverride: '',
						});
					}}
				/>
				{hasPostConflict && (
					<Notice status="warning" isDismissible={false}>
						{__(
							'Esta matéria já é utilizada por um bloco editorial anterior. No frontend, este Breaking News não será exibido enquanto houver o conflito.',
							'wordpress-template-news-blocks'
						)}
					</Notice>
				)}
			</PanelBody>

			<PanelBody
				title={__('Texto do label', 'wordpress-template-news-blocks')}
				initialOpen={false}
			>
				<TextControl
					label={__('Label', 'wordpress-template-news-blocks')}
					value={label}
					onChange={(nextLabel) => {
						setAttributes({
							label: stripTags(nextLabel),
						});
					}}
					help={__(
						'Texto curto exibido à esquerda da barra. Exemplo: Breaking News, Urgente ou Ao vivo.',
						'wordpress-template-news-blocks'
					)}
				/>
			</PanelBody>

			<PanelBody
				title={__('Ajuda', 'wordpress-template-news-blocks')}
				initialOpen={false}
			>
				<p className="wtn-blocks-breaking-news__inspector-help">
					{__(
						'Edite a headline diretamente na prévia do bloco. O link e o tempo vêm da matéria selecionada.',
						'wordpress-template-news-blocks'
					)}
				</p>

				<p className="wtn-blocks-breaking-news__inspector-help">
					{__(
						'No frontend, a headline participa da hierarquia automática: o primeiro bloco editorial principal usa H1; os demais usam H2.',
						'wordpress-template-news-blocks'
					)}
				</p>
			</PanelBody>
		</InspectorControls>
	);

	if (!postId) {
		return (
			<>
				{inspectorControls}

				<div {...blockProps}>
					<Placeholder
						icon="warning"
						label={__('Breaking News', 'wordpress-template-news-blocks')}
						instructions={__(
							'Selecione manualmente a matéria que será exibida na barra de urgência.',
							'wordpress-template-news-blocks'
						)}
					>
						<PostPicker
							label={__('Matéria do Breaking News', 'wordpress-template-news-blocks')}
							value={postId}
							excludePostIds={previousEditorialPostIds}
							onChange={(nextPostId) => {
								setAttributes({ postId: nextPostId });
							}}
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
							'wordpress-template-news-blocks'
						)}
					</Notice>
				</div>
			</>
		);
	}

	return (
		<>
			{inspectorControls}

			<div {...blockProps}>
				<div className="wtn-blocks-breaking-news__inner">
					<div className="wtn-blocks-breaking-news__badge">
						<span
							className="wtn-blocks-breaking-news__icon"
							aria-hidden="true"
						>
							⚡
						</span>

						<span className="wtn-blocks-breaking-news__label">
							{previewLabel}
						</span>
					</div>

					<div className="wtn-blocks-breaking-news__link">
						<RichText
							tagName="div"
							className="wtn-blocks-breaking-news__headline"
							value={previewTitle}
							onChange={(nextTitle) => {
								setAttributes({
									titleOverride: stripTags(nextTitle),
								});
							}}
							allowedFormats={[]}
							disableLineBreaks
							placeholder={__(
								'Escreva a headline do Breaking News',
								'wordpress-template-news-blocks'
							)}
						/>

						{formattedTime && (
							<span className="wtn-blocks-breaking-news__time">
								{formattedTime}
							</span>
						)}

						<span
							className="wtn-blocks-breaking-news__cta"
							aria-hidden="true"
						>
							›
						</span>
					</div>
				</div>
			</div>
		</>
	);
}

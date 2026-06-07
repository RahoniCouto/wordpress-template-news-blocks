import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	Placeholder,
	RadioControl,
	Spinner,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { dateI18n, getSettings } from '@wordpress/date';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

import MediaOverrideControl from '../../components/media-override-control';
import PostPicker from '../../components/post-picker';

function stripTags(value = '') {
	return value.replace(/<[^>]*>/g, '').trim();
}

function getPostTitle(post) {
	if (!post?.title?.rendered) {
		return __('Matéria sem título', 'wordpress-template-news-blocks');
	}

	return decodeEntities(stripTags(post.title.rendered));
}

function getPostExcerpt(post) {
	if (!post?.excerpt?.rendered) {
		return '';
	}

	return decodeEntities(stripTags(post.excerpt.rendered));
}

function getImageUrl(media) {
	return (
		media?.media_details?.sizes?.large?.source_url ||
		media?.media_details?.sizes?.medium_large?.source_url ||
		media?.source_url ||
		''
	);
}

export default function Edit({ attributes, setAttributes }) {
	const {
		postId = 0,
		titleOverride = '',
		excerptOverride = '',
		imageOverrideId = 0,
		mediaPosition = 'left',
	} = attributes;

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

	const featuredImageId = selectedPost?.featured_media || 0;
	const activeImageId = imageOverrideId || featuredImageId;
	const categoryId = selectedPost?.categories?.[0] || 0;

	const { activeImage, category } = useSelect(
		(select) => {
			const core = select(coreStore);

			return {
				activeImage: activeImageId
					? core.getEntityRecord('root', 'media', activeImageId)
					: null,
				category: categoryId
					? core.getEntityRecord('taxonomy', 'category', categoryId)
					: null,
			};
		},
		[activeImageId, categoryId]
	);

	const fallbackTitle = getPostTitle(selectedPost);
	const fallbackExcerpt = getPostExcerpt(selectedPost);

	const previewTitle = titleOverride.trim() || fallbackTitle;
	const previewExcerpt = excerptOverride.trim() || fallbackExcerpt;
	const previewImageUrl = getImageUrl(activeImage);

	const formattedDate = selectedPost?.date
		? dateI18n(getSettings().formats.date, selectedPost.date)
		: '';

	const blockProps = useBlockProps({
		className: [
			'wtn-blocks-editorial-hero',
			`wtn-blocks-editorial-hero--media-${mediaPosition}`,
		]
			.filter(Boolean)
			.join(' '),
	});

	const inspectorControls = (
		<InspectorControls>
			<PanelBody
				title={__('Matéria', 'wordpress-template-news-blocks')}
				initialOpen
			>
				<PostPicker
					value={postId}
					onChange={(nextPostId) => {
						setAttributes({
							postId: nextPostId,
							titleOverride: '',
							excerptOverride: '',
							imageOverrideId: 0,
						});
					}}
				/>
			</PanelBody>

			<PanelBody
				title={__('Layout', 'wordpress-template-news-blocks')}
				initialOpen={false}
			>
				<RadioControl
					label={__('Posição da imagem', 'wordpress-template-news-blocks')}
					selected={mediaPosition}
					options={[
						{
							label: __('Esquerda', 'wordpress-template-news-blocks'),
							value: 'left',
						},
						{
							label: __('Direita', 'wordpress-template-news-blocks'),
							value: 'right',
						},
					]}
					onChange={(nextPosition) => {
						setAttributes({ mediaPosition: nextPosition });
					}}
					help={__(
						'No mobile, a imagem sempre aparece acima do conteúdo.',
						'wordpress-template-news-blocks'
					)}
				/>
			</PanelBody>

			<PanelBody
				title={__('Ajuda', 'wordpress-template-news-blocks')}
				initialOpen={false}
			>
				<p className="wtn-blocks-editorial-hero__inspector-help">
					{__(
						'Edite o título, a chamada e a imagem diretamente na prévia do bloco.',
						'wordpress-template-news-blocks'
					)}
				</p>

				<p className="wtn-blocks-editorial-hero__inspector-help">
					{__(
						'No frontend, o primeiro bloco editorial principal usa H1 automaticamente. Os demais usam H2.',
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
						icon="cover-image"
						label={__('Editorial Hero', 'wordpress-template-news-blocks')}
						instructions={__(
							'Selecione manualmente a matéria principal que será exibida neste Hero.',
							'wordpress-template-news-blocks'
						)}
					>
						<PostPicker
							value={postId}
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
					<div className="wtn-blocks-editorial-hero__editor-loading">
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
				<div className="wtn-blocks-editorial-hero__inner">
					<MediaOverrideControl
						value={imageOverrideId}
						fallbackMediaId={featuredImageId}
						onChange={(nextImageId) => {
							setAttributes({ imageOverrideId: nextImageId });
						}}
						className="wtn-blocks-editorial-hero__media"
						imageClassName="wtn-blocks-editorial-hero__image"
						placeholderLabel={__(
							'Escolher imagem para o Hero',
							'wordpress-template-news-blocks'
						)}
						placeholderHelp={__(
							'Esta matéria não tem imagem destacada. Escolha uma imagem customizada ou o frontend exibirá o Hero sem mídia.',
							'wordpress-template-news-blocks'
						)}
					/>

					<div className="wtn-blocks-editorial-hero__content">
						<p className="wtn-blocks-editorial-hero__eyebrow">
							{__('Destaque', 'wordpress-template-news-blocks')}
						</p>

						<RichText
							tagName="div"
							className="wtn-blocks-editorial-hero__title"
							value={previewTitle}
							onChange={(nextTitle) => {
								setAttributes({
									titleOverride: stripTags(nextTitle),
								});
							}}
							allowedFormats={[]}
							disableLineBreaks
							placeholder={__(
								'Escreva um título para o Hero',
								'wordpress-template-news-blocks'
							)}
						/>

						<RichText
							tagName="p"
							className="wtn-blocks-editorial-hero__excerpt"
							value={previewExcerpt}
							onChange={(nextExcerpt) => {
								setAttributes({
									excerptOverride: stripTags(nextExcerpt),
								});
							}}
							allowedFormats={[]}
							disableLineBreaks
							placeholder={__(
								'Escreva uma chamada para o Hero',
								'wordpress-template-news-blocks'
							)}
						/>

						<div className="wtn-blocks-editorial-hero__meta">
							{category?.name && (
								<span className="wtn-blocks-editorial-hero__meta-item">
									{decodeEntities(category.name)}
								</span>
							)}

							{formattedDate && (
								<span className="wtn-blocks-editorial-hero__meta-item">
									{formattedDate}
								</span>
							)}
						</div>

					</div>
				</div>
			</div>
		</>
	);
}
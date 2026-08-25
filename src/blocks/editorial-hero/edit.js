import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
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

import EditorialTextOverrideControl from '../../components/editorial-text-override-control';
import MediaOverrideControl from '../../components/media-override-control';
import PostPicker from '../../components/post-picker';
import usePreviousEditorialPostIds from '../../hooks/use-previous-editorial-post-ids';
import {
	getEditorialPostExcerpt,
	getEditorialPostTitle,
} from '../../utils/editorial-post-data';
import {
	getPostOverride,
	updatePostOverrides,
} from '../../utils/editorial-post-overrides';

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		postId = 0,
		postOverrides = {},
		mediaPosition = 'left',
	} = attributes;

	const normalizedPostId = Number( postId ) || 0;

	const currentPostOverride = getPostOverride(
		postOverrides,
		normalizedPostId
	);

	const previousEditorialPostIds = usePreviousEditorialPostIds( clientId );

	const hasPostConflict =
		normalizedPostId > 0 &&
		previousEditorialPostIds.includes( normalizedPostId );

	const { selectedPost, isResolvingPost } = useSelect(
		( select ) => {
			const core = select( coreStore );

			return {
				selectedPost: normalizedPostId
					? core.getEntityRecord(
							'postType',
							'post',
							normalizedPostId
					  )
					: null,
				isResolvingPost: normalizedPostId
					? core.isResolving( 'getEntityRecord', [
							'postType',
							'post',
							normalizedPostId,
					  ] )
					: false,
			};
		},
		[ normalizedPostId ]
	);

	const featuredImageId = Number( selectedPost?.featured_media ) || 0;

	const categoryId = Number( selectedPost?.categories?.[ 0 ] ) || 0;

	const category = useSelect(
		( select ) => {
			if ( ! categoryId ) {
				return null;
			}

			return select( coreStore ).getEntityRecord(
				'taxonomy',
				'category',
				categoryId
			);
		},
		[ categoryId ]
	);

	const fallbackTitle = getEditorialPostTitle( selectedPost );
	const fallbackExcerpt = getEditorialPostExcerpt( selectedPost );

	const formattedDate = selectedPost?.date
		? dateI18n( getSettings().formats.date, selectedPost.date )
		: '';

	const blockProps = useBlockProps( {
		className: [
			'wtn-blocks-editorial-hero',
			`wtn-blocks-editorial-hero--media-${ mediaPosition }`,
		]
			.filter( Boolean )
			.join( ' ' ),
	} );

	const handlePostChange = ( nextPostId ) => {
		const normalizedNextPostId = Number( nextPostId ) || 0;

		setAttributes( {
			postId: normalizedNextPostId,
		} );
	};

	const updateCurrentPostOverride = ( nextPostOverride ) => {
		if ( normalizedPostId <= 0 ) {
			return;
		}

		setAttributes( {
			postOverrides: updatePostOverrides(
				postOverrides,
				normalizedPostId,
				nextPostOverride
			),
		} );
	};

	const inspectorControls = (
		<InspectorControls>
			<PanelBody
				title={ __( 'Matéria', 'wordpress-template-news-blocks' ) }
				initialOpen
			>
				<PostPicker
					value={ normalizedPostId }
					excludePostIds={ previousEditorialPostIds }
					onChange={ handlePostChange }
				/>

				{ hasPostConflict && (
					<Notice status="warning" isDismissible={ false }>
						{ __(
							'Esta matéria já é utilizada por um bloco editorial anterior. No frontend, este Editorial Hero não será exibido enquanto houver o conflito.',
							'wordpress-template-news-blocks'
						) }
					</Notice>
				) }
			</PanelBody>

			<PanelBody
				title={ __( 'Layout', 'wordpress-template-news-blocks' ) }
				initialOpen={ false }
			>
				<RadioControl
					label={ __(
						'Posição da imagem',
						'wordpress-template-news-blocks'
					) }
					selected={ mediaPosition }
					options={ [
						{
							label: __(
								'Esquerda',
								'wordpress-template-news-blocks'
							),
							value: 'left',
						},
						{
							label: __(
								'Direita',
								'wordpress-template-news-blocks'
							),
							value: 'right',
						},
					] }
					onChange={ ( nextPosition ) => {
						setAttributes( {
							mediaPosition: nextPosition,
						} );
					} }
					help={ __(
						'No mobile, a imagem sempre aparece acima do conteúdo.',
						'wordpress-template-news-blocks'
					) }
				/>
			</PanelBody>

			<PanelBody
				title={ __( 'Ajuda', 'wordpress-template-news-blocks' ) }
				initialOpen={ false }
			>
				<p className="wtn-blocks-editorial-hero__inspector-help">
					{ __(
						'Edite o título, a chamada e a imagem diretamente na prévia do bloco.',
						'wordpress-template-news-blocks'
					) }
				</p>

				<p className="wtn-blocks-editorial-hero__inspector-help">
					{ __(
						'No frontend, o primeiro bloco editorial principal usa H1 automaticamente. Os demais usam H2.',
						'wordpress-template-news-blocks'
					) }
				</p>
			</PanelBody>
		</InspectorControls>
	);

	if ( ! normalizedPostId ) {
		return (
			<>
				{ inspectorControls }

				<div { ...blockProps }>
					<Placeholder
						icon="cover-image"
						label={ __(
							'Editorial Hero',
							'wordpress-template-news-blocks'
						) }
						instructions={ __(
							'Selecione manualmente a matéria principal que será exibida neste Hero.',
							'wordpress-template-news-blocks'
						) }
					>
						<PostPicker
							value={ normalizedPostId }
							excludePostIds={ previousEditorialPostIds }
							onChange={ handlePostChange }
						/>
					</Placeholder>
				</div>
			</>
		);
	}

	if ( isResolvingPost && ! selectedPost ) {
		return (
			<>
				{ inspectorControls }

				<div { ...blockProps }>
					<div className="wtn-blocks-editorial-hero__editor-loading">
						<Spinner />
					</div>
				</div>
			</>
		);
	}

	if ( ! selectedPost ) {
		return (
			<>
				{ inspectorControls }

				<div { ...blockProps }>
					<Notice status="warning" isDismissible={ false }>
						{ __(
							'A matéria selecionada não foi encontrada ou não está disponível.',
							'wordpress-template-news-blocks'
						) }
					</Notice>
				</div>
			</>
		);
	}

	return (
		<>
			{ inspectorControls }

			<div { ...blockProps }>
				<div className="wtn-blocks-editorial-hero__inner">
					<MediaOverrideControl
						value={ currentPostOverride.imageOverrideId }
						fallbackMediaId={ featuredImageId }
						onChange={ ( nextImageOverrideId ) => {
							updateCurrentPostOverride( {
								...currentPostOverride,
								imageOverrideId:
									Number( nextImageOverrideId ) || 0,
							} );
						} }
						className="wtn-blocks-editorial-hero__media"
						imageClassName="wtn-blocks-editorial-hero__image"
						changeImageLabel={ __(
							'Alterar imagem do Hero',
							'wordpress-template-news-blocks'
						) }
						placeholderLabel={ __(
							'Escolher imagem para o Hero',
							'wordpress-template-news-blocks'
						) }
						placeholderHelp={ __(
							'Esta matéria não tem imagem destacada. Escolha uma imagem customizada ou o frontend exibirá o Hero sem mídia.',
							'wordpress-template-news-blocks'
						) }
					/>

					<div className="wtn-blocks-editorial-hero__content">
						<p className="wtn-blocks-editorial-hero__eyebrow">
							{ __(
								'Destaque',
								'wordpress-template-news-blocks'
							) }
						</p>

						<EditorialTextOverrideControl
							tagName="div"
							className="wtn-blocks-editorial-hero__title"
							value={ currentPostOverride.titleOverride }
							fallbackValue={ fallbackTitle }
							onChange={ ( nextTitleOverride ) => {
								updateCurrentPostOverride( {
									...currentPostOverride,
									titleOverride: nextTitleOverride,
								} );
							} }
							placeholder={ __(
								'Escreva um título para o Hero',
								'wordpress-template-news-blocks'
							) }
						/>

						<EditorialTextOverrideControl
							tagName="p"
							className="wtn-blocks-editorial-hero__excerpt"
							value={ currentPostOverride.excerptOverride }
							fallbackValue={ fallbackExcerpt }
							onChange={ ( nextExcerptOverride ) => {
								updateCurrentPostOverride( {
									...currentPostOverride,
									excerptOverride: nextExcerptOverride,
								} );
							} }
							placeholder={ __(
								'Escreva uma chamada para o Hero',
								'wordpress-template-news-blocks'
							) }
						/>

						<div className="wtn-blocks-editorial-hero__meta">
							{ category?.name && (
								<span className="wtn-blocks-editorial-hero__meta-item">
									{ decodeEntities( category.name ) }
								</span>
							) }

							{ formattedDate && (
								<span className="wtn-blocks-editorial-hero__meta-item">
									{ formattedDate }
								</span>
							) }
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

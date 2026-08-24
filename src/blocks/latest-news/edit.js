import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	RadioControl,
	Spinner,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { dateI18n, getSettings } from '@wordpress/date';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';

import CategoryPicker from '../../components/category-picker';
import EditorialTextOverrideControl from '../../components/editorial-text-override-control';
import MediaOverrideControl from '../../components/media-override-control';
import useLatestNewsPosts from '../../hooks/use-latest-news-posts';
import usePreviousEditorialPostIds from '../../hooks/use-previous-editorial-post-ids';
import {
	getPostOverride,
	sanitizeEditorialText,
	updatePostOverrides,
} from '../../utils/editorial-post-overrides';

function normalizePostCount( postCount = 4 ) {
	const normalizedPostCount = Number( postCount ) || 0;

	return [ 3, 4, 5 ].includes( normalizedPostCount )
		? normalizedPostCount
		: 4;
}

function normalizeResolvedPostIds( postIds = [] ) {
	if ( ! Array.isArray( postIds ) ) {
		return [];
	}

	return [
		...new Set(
			postIds
				.map( ( postId ) => Number( postId ) || 0 )
				.filter( ( postId ) => postId > 0 )
		),
	];
}

function arePostIdListsEqual( firstPostIds = [], secondPostIds = [] ) {
	const normalizedFirstPostIds = normalizeResolvedPostIds( firstPostIds );
	const normalizedSecondPostIds = normalizeResolvedPostIds( secondPostIds );

	return (
		normalizedFirstPostIds.length === normalizedSecondPostIds.length &&
		normalizedFirstPostIds.every(
			( postId, index ) => postId === normalizedSecondPostIds[ index ]
		)
	);
}

function getPostTitle( post ) {
	if ( ! post?.title?.rendered ) {
		return __( 'Matéria sem título', 'wordpress-template-news-blocks' );
	}

	return decodeEntities( sanitizeEditorialText( post.title.rendered ) );
}

function LatestNewsPostEditor( {
	post,
	postOverride,
	onChange,
	layoutVariant,
	sectionCategory,
} ) {
	const postCategoryId = sectionCategory
		? 0
		: Number( post?.categories?.[ 0 ] ) || 0;

	const postCategory = useSelect(
		( select ) => {
			if ( ! postCategoryId ) {
				return null;
			}

			return select( coreStore ).getEntityRecord(
				'taxonomy',
				'category',
				postCategoryId
			);
		},
		[ postCategoryId ]
	);

	const category = sectionCategory || postCategory;
	const featuredImageId = Number( post?.featured_media ) || 0;
	const fallbackTitle = getPostTitle( post );

	const formattedDate = post?.date
		? dateI18n( getSettings().formats.date, post.date )
		: '';

	const showCategory = Boolean(
		layoutVariant === 'horizontal' && category?.name
	);

	return (
		<article className="wtn-blocks-latest-news__item">
			<MediaOverrideControl
				value={ postOverride.imageOverrideId }
				fallbackMediaId={ featuredImageId }
				onChange={ ( nextImageOverrideId ) => {
					onChange( {
						...postOverride,
						imageOverrideId: Number( nextImageOverrideId ) || 0,
					} );
				} }
				className="wtn-blocks-latest-news__media"
				imageClassName="wtn-blocks-latest-news__image"
				changeImageLabel={ __(
					'Alterar imagem da matéria',
					'wordpress-template-news-blocks'
				) }
				placeholderLabel={ __(
					'Escolher imagem para a matéria',
					'wordpress-template-news-blocks'
				) }
				placeholderHelp={ __(
					'Esta matéria não possui imagem destacada. Escolha uma imagem customizada para esta ocorrência editorial.',
					'wordpress-template-news-blocks'
				) }
			/>

			<div className="wtn-blocks-latest-news__content">
				{ showCategory && (
					<span className="wtn-blocks-latest-news__category">
						{ decodeEntities( category.name ) }
					</span>
				) }

				<EditorialTextOverrideControl
					tagName="div"
					className="wtn-blocks-latest-news__title"
					value={ postOverride.titleOverride }
					fallbackValue={ fallbackTitle }
					onChange={ ( nextTitleOverride ) => {
						onChange( {
							...postOverride,
							titleOverride: nextTitleOverride,
						} );
					} }
					placeholder={ __(
						'Escreva um título',
						'wordpress-template-news-blocks'
					) }
				/>

				{ formattedDate && (
					<time
						className="wtn-blocks-latest-news__date"
						dateTime={ post.date }
					>
						{ formattedDate }
					</time>
				) }
			</div>
		</article>
	);
}

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		categoryId = 0,
		layoutVariant = 'horizontal',
		postCount = 4,
		titleOverride = '',
		showViewAll = false,
		viewAllUrl = '',
		postOverrides = {},
		resolvedPostIds: localResolvedPostIds = [],
	} = attributes;

	const normalizedCategoryId = Number( categoryId ) || 0;

	const normalizedPostCount = normalizePostCount( postCount );

	const normalizedLayoutVariant = [ 'horizontal', 'vertical' ].includes(
		layoutVariant
	)
		? layoutVariant
		: 'horizontal';

	const normalizedPostOverrides =
		postOverrides &&
		typeof postOverrides === 'object' &&
		! Array.isArray( postOverrides )
			? postOverrides
			: {};

	const normalizedViewAllUrl =
		typeof viewAllUrl === 'string' ? viewAllUrl.trim() : '';

	const previousEditorialPostIds = usePreviousEditorialPostIds( clientId );

	const {
		resolvedPostIds: computedResolvedPostIds,
		resolvedPosts,
		isResolving: isResolvingPosts,
		hasError: hasResolutionError,
	} = useLatestNewsPosts( {
		categoryId: normalizedCategoryId,
		postCount: normalizedPostCount,
		excludePostIds: previousEditorialPostIds,
	} );

	useEffect( () => {
		if ( isResolvingPosts || hasResolutionError ) {
			return;
		}

		if (
			arePostIdListsEqual( localResolvedPostIds, computedResolvedPostIds )
		) {
			return;
		}

		setAttributes( {
			resolvedPostIds: normalizeResolvedPostIds(
				computedResolvedPostIds
			),
		} );
	}, [
		computedResolvedPostIds,
		hasResolutionError,
		isResolvingPosts,
		localResolvedPostIds,
		setAttributes,
	] );

	const sectionCategory = useSelect(
		( select ) => {
			if ( ! normalizedCategoryId ) {
				return null;
			}

			return select( coreStore ).getEntityRecord(
				'taxonomy',
				'category',
				normalizedCategoryId
			);
		},
		[ normalizedCategoryId ]
	);

	const categoryTitle = sectionCategory?.name
		? decodeEntities( sectionCategory.name )
		: '';

	const defaultSectionTitle =
		categoryTitle ||
		__( 'Últimas notícias', 'wordpress-template-news-blocks' );

	const categoryUrl = sectionCategory?.link || '';

	let resolvedViewAllUrl = '';

	if ( showViewAll ) {
		resolvedViewAllUrl = normalizedCategoryId
			? categoryUrl
			: normalizedViewAllUrl;
	}

	const handlePostOverrideChange = ( postId, nextPostOverride ) => {
		const normalizedPostId = Number( postId ) || 0;

		if ( ! normalizedPostId ) {
			return;
		}

		setAttributes( {
			postOverrides: updatePostOverrides(
				normalizedPostOverrides,
				normalizedPostId,
				nextPostOverride
			),
		} );
	};

	const blockProps = useBlockProps( {
		className: [
			'wtn-blocks-latest-news',
			`wtn-blocks-latest-news--${ normalizedLayoutVariant }`,
			`wtn-blocks-latest-news--count-${ normalizedPostCount }`,
		]
			.filter( Boolean )
			.join( ' ' ),
	} );

	const hasResolvedPosts = resolvedPosts.length > 0;

	const hasFewerPostsThanConfigured =
		! isResolvingPosts &&
		hasResolvedPosts &&
		resolvedPosts.length < normalizedPostCount;

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __(
						'Configuração da seção',
						'wordpress-template-news-blocks'
					) }
					initialOpen
				>
					<CategoryPicker
						value={ normalizedCategoryId }
						onChange={ ( nextCategoryId ) => {
							setAttributes( {
								categoryId: Number( nextCategoryId ) || 0,
							} );
						} }
					/>

					<RadioControl
						label={ __(
							'Quantidade de notícias',
							'wordpress-template-news-blocks'
						) }
						selected={ String( normalizedPostCount ) }
						options={ [
							{
								label: '3',
								value: '3',
							},
							{
								label: '4',
								value: '4',
							},
							{
								label: '5',
								value: '5',
							},
						] }
						onChange={ ( nextPostCount ) => {
							setAttributes( {
								postCount: normalizePostCount( nextPostCount ),
							} );
						} }
						help={ __(
							'O bloco resolve automaticamente as notícias mais recentes disponíveis.',
							'wordpress-template-news-blocks'
						) }
					/>

					<p className="wtn-blocks-latest-news__inspector-help">
						{ __(
							'O título da seção pode ser editado diretamente na prévia do bloco.',
							'wordpress-template-news-blocks'
						) }
					</p>
				</PanelBody>

				<PanelBody
					title={ __( 'Layout', 'wordpress-template-news-blocks' ) }
					initialOpen={ false }
				>
					<RadioControl
						label={ __(
							'Variação visual',
							'wordpress-template-news-blocks'
						) }
						selected={ normalizedLayoutVariant }
						options={ [
							{
								label: __(
									'Horizontal',
									'wordpress-template-news-blocks'
								),
								value: 'horizontal',
							},
							{
								label: __(
									'Vertical',
									'wordpress-template-news-blocks'
								),
								value: 'vertical',
							},
						] }
						onChange={ ( nextLayoutVariant ) => {
							setAttributes( {
								layoutVariant: nextLayoutVariant,
							} );
						} }
						help={ __(
							'O layout altera apenas a apresentação. A quantidade configurada permanece a mesma.',
							'wordpress-template-news-blocks'
						) }
					/>
				</PanelBody>

				<PanelBody
					title={ __(
						'Link “Ver todas”',
						'wordpress-template-news-blocks'
					) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __(
							'Exibir “Ver todas”',
							'wordpress-template-news-blocks'
						) }
						checked={ Boolean( showViewAll ) }
						onChange={ ( nextShowViewAll ) => {
							setAttributes( {
								showViewAll: Boolean( nextShowViewAll ),
							} );
						} }
						help={
							normalizedCategoryId
								? __(
										'Com categoria definida, o destino é automaticamente o archive da categoria.',
										'wordpress-template-news-blocks'
								  )
								: __(
										'Sem categoria, informe manualmente o destino do link.',
										'wordpress-template-news-blocks'
								  )
						}
					/>

					{ showViewAll && ! normalizedCategoryId && (
						<TextControl
							label={ __(
								'URL',
								'wordpress-template-news-blocks'
							) }
							type="url"
							value={
								typeof viewAllUrl === 'string' ? viewAllUrl : ''
							}
							onChange={ ( nextViewAllUrl ) => {
								setAttributes( {
									viewAllUrl: nextViewAllUrl,
								} );
							} }
							help={ __(
								'Se a URL estiver vazia, “Ver todas” não será exibido.',
								'wordpress-template-news-blocks'
							) }
						/>
					) }
				</PanelBody>
			</InspectorControls>

			<section { ...blockProps }>
				<div className="wtn-blocks-latest-news__header">
					<EditorialTextOverrideControl
						tagName="div"
						className="wtn-blocks-latest-news__section-title"
						value={ titleOverride }
						fallbackValue={ defaultSectionTitle }
						onChange={ ( nextTitleOverride ) => {
							setAttributes( {
								titleOverride: nextTitleOverride,
							} );
						} }
						placeholder={ __(
							'Título da seção',
							'wordpress-template-news-blocks'
						) }
					/>

					{ resolvedViewAllUrl && (
						<span className="wtn-blocks-latest-news__view-all">
							{ __(
								'Ver todas',
								'wordpress-template-news-blocks'
							) }
						</span>
					) }
				</div>

				{ isResolvingPosts && ! hasResolvedPosts && (
					<div className="wtn-blocks-latest-news__loading">
						<Spinner />
					</div>
				) }

				{ hasResolutionError && (
					<Notice status="error" isDismissible={ false }>
						{ __(
							'Não foi possível resolver as notícias deste bloco. Tente novamente ou recarregue o editor.',
							'wordpress-template-news-blocks'
						) }
					</Notice>
				) }

				{ ! isResolvingPosts &&
					! hasResolutionError &&
					! hasResolvedPosts && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'Nenhuma notícia elegível está disponível para esta configuração. O bloco não será exibido no frontend enquanto permanecer vazio.',
								'wordpress-template-news-blocks'
							) }
						</Notice>
					) }

				{ hasResolvedPosts && (
					<div className="wtn-blocks-latest-news__items">
						{ resolvedPosts.map( ( post, postIndex ) => {
							const postId =
								computedResolvedPostIds[ postIndex ] ||
								Number( post?.id ) ||
								0;

							if ( ! post || ! postId ) {
								return null;
							}

							return (
								<LatestNewsPostEditor
									key={ postId }
									post={ post }
									postOverride={ getPostOverride(
										normalizedPostOverrides,
										postId
									) }
									onChange={ ( nextPostOverride ) => {
										handlePostOverrideChange(
											postId,
											nextPostOverride
										);
									} }
									layoutVariant={ normalizedLayoutVariant }
									sectionCategory={ sectionCategory }
								/>
							);
						} ) }
					</div>
				) }

				{ hasFewerPostsThanConfigured && (
					<p className="wtn-blocks-latest-news__editor-summary">
						{ sprintf(
							/* translators: 1: number of available posts, 2: configured number of posts. */
							__(
								'%1$d de %2$d notícias disponíveis para esta configuração.',
								'wordpress-template-news-blocks'
							),
							resolvedPosts.length,
							normalizedPostCount
						) }
					</p>
				) }
			</section>
		</>
	);
}

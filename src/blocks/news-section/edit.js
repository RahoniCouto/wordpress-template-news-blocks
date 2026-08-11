import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Notice,
	PanelBody,
	RadioControl,
	Spinner,
	TextControl,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { dateI18n, getSettings } from '@wordpress/date';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';

import CategoryPicker from '../../components/category-picker';
import EditorialPostSlotControl from '../../components/editorial-post-slot-control';
import EditorialTextOverrideControl from '../../components/editorial-text-override-control';
import MediaOverrideControl from '../../components/media-override-control';
import useNewsSectionPosts from '../../hooks/use-news-section-posts';
import usePreviousEditorialPostIds from '../../hooks/use-previous-editorial-post-ids';
import {
	getPostOverride,
	sanitizeEditorialText,
	updatePostOverrides,
} from '../../utils/editorial-post-overrides';

const slotLabels = [
	__( 'Destaque', 'wordpress-template-news-blocks' ),
	__( 'Secundária 1', 'wordpress-template-news-blocks' ),
	__( 'Secundária 2', 'wordpress-template-news-blocks' ),
	__( 'Secundária 3', 'wordpress-template-news-blocks' ),
];

function normalizeSlotPostIds( slotPostIds = [] ) {
	return Array.from(
		{ length: 4 },
		( _, slotIndex ) => Number( slotPostIds[ slotIndex ] ) || 0
	);
}

function arePostIdListsEqual( firstPostIds, secondPostIds ) {
	const normalizedFirstPostIds = normalizeSlotPostIds( firstPostIds );

	const normalizedSecondPostIds = normalizeSlotPostIds( secondPostIds );

	return normalizedFirstPostIds.every(
		( postId, slotIndex ) => postId === normalizedSecondPostIds[ slotIndex ]
	);
}

function getPostTitle( post ) {
	if ( ! post?.title?.rendered ) {
		return __( 'Matéria sem título', 'wordpress-template-news-blocks' );
	}

	return decodeEntities( sanitizeEditorialText( post.title.rendered ) );
}

function getPostExcerpt( post ) {
	if ( ! post?.excerpt?.rendered ) {
		return '';
	}

	return decodeEntities( sanitizeEditorialText( post.excerpt.rendered ) );
}

function getReadingTimeLabel( post ) {
	const renderedContent = post?.content?.rendered || '';

	const content = decodeEntities( sanitizeEditorialText( renderedContent ) );

	const words = content.match( /\p{L}+/gu ) || [];

	const minutes = Math.max( 1, Math.ceil( words.length / 200 ) );

	return sprintf(
		/* translators: %d: estimated reading time in minutes. */
		_n(
			'%d min de leitura',
			'%d min de leitura',
			minutes,
			'wordpress-template-news-blocks'
		),
		minutes
	);
}

function NewsSectionPostEditor( {
	post,
	postId,
	postOverride,
	onChange,
	variant,
	sectionCategoryId,
} ) {
	const postCategoryId =
		Number( sectionCategoryId ) || Number( post?.categories?.[ 0 ] ) || 0;

	const category = useSelect(
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

	if ( ! post || ! postId ) {
		return null;
	}

	const isFeatured = variant === 'featured';

	const classPrefix = isFeatured
		? 'wtn-blocks-news-section__featured'
		: 'wtn-blocks-news-section__secondary';

	const featuredImageId = Number( post.featured_media ) || 0;

	const fallbackTitle = getPostTitle( post );
	const fallbackExcerpt = getPostExcerpt( post );

	const formattedDate = post.date
		? dateI18n( getSettings().formats.date, post.date )
		: '';

	const readingTime = getReadingTimeLabel( post );

	return (
		<article className={ `${ classPrefix }-card` }>
			<MediaOverrideControl
				value={ postOverride.imageOverrideId }
				fallbackMediaId={ featuredImageId }
				onChange={ ( nextImageOverrideId ) => {
					onChange( {
						...postOverride,
						imageOverrideId: Number( nextImageOverrideId ) || 0,
					} );
				} }
				className={ `${ classPrefix }-media` }
				imageClassName={ `${ classPrefix }-image` }
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

			<div className={ `${ classPrefix }-content` }>
				{ category?.name && (
					<span className={ `${ classPrefix }-category` }>
						{ decodeEntities( category.name ) }
					</span>
				) }

				<EditorialTextOverrideControl
					tagName="div"
					className={ `${ classPrefix }-title` }
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

				{ isFeatured && (
					<EditorialTextOverrideControl
						tagName="p"
						className={ `${ classPrefix }-excerpt` }
						value={ postOverride.excerptOverride }
						fallbackValue={ fallbackExcerpt }
						onChange={ ( nextExcerptOverride ) => {
							onChange( {
								...postOverride,
								excerptOverride: nextExcerptOverride,
							} );
						} }
						placeholder={ __(
							'Escreva uma chamada',
							'wordpress-template-news-blocks'
						) }
					/>
				) }

				<div className={ `${ classPrefix }-meta` }>
					{ formattedDate && (
						<span className={ `${ classPrefix }-meta-item` }>
							{ formattedDate }
						</span>
					) }

					<span className={ `${ classPrefix }-meta-item` }>
						{ readingTime }
					</span>
				</div>
			</div>
		</article>
	);
}

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		categoryId = 0,
		selectionMode = 'automatic',
		layoutVariant = 'featured-media-left',
		titleOverride = '',
		viewAllLabelOverride = '',
		viewAllUrlOverride = '',
		slotPostIds = [ 0, 0, 0, 0 ],
		postOverrides = {},
		resolvedPostIds: localResolvedPostIds = [ 0, 0, 0, 0 ],
	} = attributes;

	const normalizedCategoryId = Number( categoryId ) || 0;

	const normalizedSlotPostIds = useMemo(
		() => normalizeSlotPostIds( slotPostIds ),
		[ slotPostIds ]
	);

	const normalizedPostOverrides =
		postOverrides &&
		typeof postOverrides === 'object' &&
		! Array.isArray( postOverrides )
			? postOverrides
			: {};

	const previousEditorialPostIds = usePreviousEditorialPostIds( clientId );

	const configuredSlotPosts = useSelect(
		( select ) => {
			const core = select( coreStore );

			return normalizedSlotPostIds.map( ( postId ) => {
				if ( ! postId ) {
					return null;
				}

				return core.getEntityRecord( 'postType', 'post', postId );
			} );
		},
		[ normalizedSlotPostIds ]
	);

	const handleCategoryChange = ( nextCategoryId ) => {
		const normalizedNextCategoryId = Number( nextCategoryId ) || 0;

		if ( normalizedNextCategoryId === normalizedCategoryId ) {
			return;
		}

		if ( ! normalizedNextCategoryId ) {
			setAttributes( {
				categoryId: 0,
			} );

			return;
		}

		const nextSlotPostIds = normalizedSlotPostIds.map(
			( postId, slotIndex ) => {
				if ( ! postId ) {
					return 0;
				}

				const post = configuredSlotPosts[ slotIndex ];

				if ( ! post || ! Array.isArray( post.categories ) ) {
					return postId;
				}

				const postCategoryIds = post.categories.map(
					( categoryTermId ) => Number( categoryTermId ) || 0
				);

				return postCategoryIds.includes( normalizedNextCategoryId )
					? postId
					: 0;
			}
		);

		setAttributes( {
			categoryId: normalizedNextCategoryId,
			slotPostIds: nextSlotPostIds,
		} );
	};

	const {
		resolvedPostIds: computedResolvedPostIds,
		resolvedPosts,
		slotSources,
		isResolving: isResolvingPosts,
	} = useNewsSectionPosts( {
		categoryId: normalizedCategoryId,
		selectionMode,
		slotPostIds: normalizedSlotPostIds,
		excludePostIds: previousEditorialPostIds,
	} );

	useEffect( () => {
		if ( isResolvingPosts ) {
			return;
		}

		if (
			arePostIdListsEqual( localResolvedPostIds, computedResolvedPostIds )
		) {
			return;
		}

		setAttributes( {
			resolvedPostIds: normalizeSlotPostIds( computedResolvedPostIds ),
		} );
	}, [
		computedResolvedPostIds,
		isResolvingPosts,
		localResolvedPostIds,
		setAttributes,
	] );

	const updateSlotPostId = ( slotIndex, nextPostId ) => {
		const nextSlotPostIds = [ ...normalizedSlotPostIds ];

		nextSlotPostIds[ slotIndex ] = Number( nextPostId ) || 0;

		setAttributes( {
			slotPostIds: nextSlotPostIds,
		} );
	};

	const getSlotExcludedPostIds = ( slotIndex ) => [
		...previousEditorialPostIds,
		...normalizedSlotPostIds.filter(
			( postId, currentSlotIndex ) =>
				currentSlotIndex !== slotIndex && postId > 0
		),
	];

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

	const categoryUrl = sectionCategory?.link || '';

	const resolvedViewAllUrl = viewAllUrlOverride.trim() || categoryUrl;

	const defaultViewAllLabel = __(
		'Ver todas',
		'wordpress-template-news-blocks'
	);

	const featuredPostId = computedResolvedPostIds[ 0 ] || 0;

	const featuredPost = resolvedPosts[ 0 ] || null;

	const secondaryPostIds = computedResolvedPostIds.slice( 1, 4 );

	const secondaryPosts = resolvedPosts.slice( 1, 4 );

	const blockProps = useBlockProps( {
		className: [
			'wtn-blocks-news-section',
			`wtn-blocks-news-section--${ layoutVariant }`,
		]
			.filter( Boolean )
			.join( ' ' ),
	} );

	const inspectorControls = (
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
					onChange={ handleCategoryChange }
				/>

				<p className="wtn-blocks-news-section__inspector-help">
					{ __(
						'O título da seção pode ser editado diretamente na prévia do bloco.',
						'wordpress-template-news-blocks'
					) }
				</p>
			</PanelBody>

			<PanelBody
				title={ __(
					'Link “Ver todas”',
					'wordpress-template-news-blocks'
				) }
				initialOpen={ false }
			>
				<TextControl
					label={ __( 'URL', 'wordpress-template-news-blocks' ) }
					type="url"
					value={ viewAllUrlOverride }
					placeholder={ categoryUrl }
					onChange={ ( nextUrl ) => {
						setAttributes( {
							viewAllUrlOverride: nextUrl,
						} );
					} }
					help={
						normalizedCategoryId
							? __(
									'Deixe vazio para usar automaticamente o link da categoria.',
									'wordpress-template-news-blocks'
							  )
							: __(
									'Sem categoria, informe uma URL para exibir o link.',
									'wordpress-template-news-blocks'
							  )
					}
				/>

				<p className="wtn-blocks-news-section__inspector-help">
					{ __(
						'O texto do link pode ser editado diretamente na prévia quando houver uma URL disponível.',
						'wordpress-template-news-blocks'
					) }
				</p>
			</PanelBody>

			<PanelBody
				title={ __(
					'Seleção de matérias',
					'wordpress-template-news-blocks'
				) }
				initialOpen
			>
				<RadioControl
					label={ __(
						'Modo de seleção',
						'wordpress-template-news-blocks'
					) }
					selected={ selectionMode }
					options={ [
						{
							label: __(
								'Automática',
								'wordpress-template-news-blocks'
							),
							value: 'automatic',
						},
						{
							label: __(
								'Manual',
								'wordpress-template-news-blocks'
							),
							value: 'manual',
						},
					] }
					onChange={ ( nextSelectionMode ) => {
						setAttributes( {
							selectionMode: nextSelectionMode,
						} );
					} }
					help={
						selectionMode === 'automatic'
							? __(
									'Os slots sem substituição manual usam as matérias mais recentes disponíveis.',
									'wordpress-template-news-blocks'
							  )
							: __(
									'Cada matéria da seção será escolhida manualmente.',
									'wordpress-template-news-blocks'
							  )
					}
				/>

				<div className="wtn-blocks-news-section__slot-controls">
					{ slotLabels.map( ( slotLabel, slotIndex ) => (
						<EditorialPostSlotControl
							key={ slotIndex }
							label={ slotLabel }
							selectionMode={ selectionMode }
							configuredPostId={
								normalizedSlotPostIds[ slotIndex ]
							}
							resolvedPostId={
								computedResolvedPostIds[ slotIndex ]
							}
							resolvedPost={ resolvedPosts[ slotIndex ] }
							source={ slotSources[ slotIndex ] }
							categoryId={ normalizedCategoryId }
							excludePostIds={ getSlotExcludedPostIds(
								slotIndex
							) }
							onChange={ ( nextPostId ) => {
								updateSlotPostId( slotIndex, nextPostId );
							} }
						/>
					) ) }
				</div>
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
					selected={ layoutVariant }
					options={ [
						{
							label: __(
								'Layout 1 — imagem principal à esquerda',
								'wordpress-template-news-blocks'
							),
							value: 'featured-media-left',
						},
						{
							label: __(
								'Layout 2 — imagem principal à direita',
								'wordpress-template-news-blocks'
							),
							value: 'featured-media-right',
						},
					] }
					onChange={ ( nextLayoutVariant ) => {
						setAttributes( {
							layoutVariant: nextLayoutVariant,
						} );
					} }
					help={ __(
						'No mobile, os dois layouts convergem para destaque empilhado e matérias secundárias compactas.',
						'wordpress-template-news-blocks'
					) }
				/>
			</PanelBody>
		</InspectorControls>
	);

	return (
		<>
			{ inspectorControls }

			<section { ...blockProps }>
				<div className="wtn-blocks-news-section__header">
					<EditorialTextOverrideControl
						tagName="div"
						className="wtn-blocks-news-section__section-title"
						value={ titleOverride }
						fallbackValue={ categoryTitle }
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
						<div className="wtn-blocks-news-section__view-all">
							<EditorialTextOverrideControl
								tagName="span"
								className="wtn-blocks-news-section__view-all-label"
								value={ viewAllLabelOverride }
								fallbackValue={ defaultViewAllLabel }
								onChange={ ( nextLabelOverride ) => {
									setAttributes( {
										viewAllLabelOverride: nextLabelOverride,
									} );
								} }
								placeholder={ defaultViewAllLabel }
							/>

							<span
								className="wtn-blocks-news-section__view-all-icon"
								aria-hidden="true"
							>
								→
							</span>
						</div>
					) }
				</div>

				{ isResolvingPosts && ! featuredPost && (
					<div className="wtn-blocks-news-section__loading">
						<Spinner />
					</div>
				) }

				{ ! isResolvingPosts && ! featuredPost && (
					<Notice status="warning" isDismissible={ false }>
						{ selectionMode === 'manual'
							? __(
									'Defina a matéria de destaque para visualizar a seção. Sem destaque, o bloco não será exibido no frontend.',
									'wordpress-template-news-blocks'
							  )
							: __(
									'Nenhuma matéria disponível pôde ser resolvida para o destaque desta seção.',
									'wordpress-template-news-blocks'
							  ) }
					</Notice>
				) }

				{ featuredPost && featuredPostId > 0 && (
					<>
						<NewsSectionPostEditor
							post={ featuredPost }
							postId={ featuredPostId }
							postOverride={ getPostOverride(
								normalizedPostOverrides,
								featuredPostId
							) }
							onChange={ ( nextPostOverride ) => {
								handlePostOverrideChange(
									featuredPostId,
									nextPostOverride
								);
							} }
							variant="featured"
							sectionCategoryId={ normalizedCategoryId }
						/>

						<div className="wtn-blocks-news-section__secondary-list">
							{ secondaryPosts.map( ( post, secondaryIndex ) => {
								const postId =
									secondaryPostIds[ secondaryIndex ] || 0;

								if ( ! post || ! postId ) {
									return (
										<div
											key={ secondaryIndex }
											className="wtn-blocks-news-section__secondary-empty"
										>
											{ __(
												'Matéria secundária não definida.',
												'wordpress-template-news-blocks'
											) }
										</div>
									);
								}

								return (
									<NewsSectionPostEditor
										key={ postId }
										post={ post }
										postId={ postId }
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
										variant="secondary"
										sectionCategoryId={
											normalizedCategoryId
										}
									/>
								);
							} ) }
						</div>
					</>
				) }
			</section>
		</>
	);
}

import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, Placeholder, RadioControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

import CategoryPicker from '../../components/category-picker';
import useNewsSectionPosts from '../../hooks/use-news-section-posts';
import usePreviousEditorialPostIds from '../../hooks/use-previous-editorial-post-ids';
import EditorialPostSlotControl from '../../components/editorial-post-slot-control';

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

function getPostTitle( post ) {
	if ( ! post?.title?.rendered ) {
		return __( 'Matéria não definida', 'wordpress-template-news-blocks' );
	}

	return decodeEntities( post.title.rendered );
}

function getResolvedPostLabel( post, isResolving ) {
	if ( post ) {
		return getPostTitle( post );
	}

	if ( isResolving ) {
		return __( 'Carregando…', 'wordpress-template-news-blocks' );
	}

	return __( 'Não definida', 'wordpress-template-news-blocks' );
}

function arePostIdListsEqual( firstPostIds, secondPostIds ) {
	const normalizedFirstPostIds = normalizeSlotPostIds( firstPostIds );
	const normalizedSecondPostIds = normalizeSlotPostIds( secondPostIds );

	return normalizedFirstPostIds.every(
		( postId, slotIndex ) => postId === normalizedSecondPostIds[ slotIndex ]
	);
}

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		categoryId = 0,
		selectionMode = 'automatic',
		layoutVariant = 'featured-media-left',
		slotPostIds = [ 0, 0, 0, 0 ],
		resolvedPostIds: localResolvedPostIds = [ 0, 0, 0, 0 ],
	} = attributes;

	const normalizedCategoryId = Number( categoryId ) || 0;
	const normalizedSlotPostIds = useMemo(
		() => normalizeSlotPostIds( slotPostIds ),
		[ slotPostIds ]
	);
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
		slotPostIds,
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

	const category = useSelect(
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

	const categoryLabel = category?.name
		? decodeEntities( category.name )
		: __( 'Sem categoria', 'wordpress-template-news-blocks' );

	const selectionModeLabel =
		selectionMode === 'manual'
			? __( 'Manual', 'wordpress-template-news-blocks' )
			: __( 'Automática', 'wordpress-template-news-blocks' );

	const layoutLabel =
		layoutVariant === 'featured-media-right'
			? __( 'Layout 2', 'wordpress-template-news-blocks' )
			: __( 'Layout 1', 'wordpress-template-news-blocks' );

	const blockProps = useBlockProps( {
		className: [
			'wtn-blocks-news-section',
			`wtn-blocks-news-section--${ layoutVariant }`,
		]
			.filter( Boolean )
			.join( ' ' ),
	} );

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
						onChange={ handleCategoryChange }
					/>
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
							'No mobile, os dois layouts convergem para destaque empilhado e matérias secundárias em lista.',
							'wordpress-template-news-blocks'
						) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<Placeholder
					icon="screenoptions"
					label={ __(
						'News Section',
						'wordpress-template-news-blocks'
					) }
					instructions={ __(
						'Confira abaixo as matérias atualmente resolvidas para esta seção.',
						'wordpress-template-news-blocks'
					) }
				>
					<div className="wtn-blocks-news-section__editor-summary">
						<p>
							<strong>
								{ __(
									'Categoria:',
									'wordpress-template-news-blocks'
								) }
							</strong>{ ' ' }
							{ categoryLabel }
						</p>

						<p>
							<strong>
								{ __(
									'Seleção:',
									'wordpress-template-news-blocks'
								) }
							</strong>{ ' ' }
							{ selectionModeLabel }
						</p>

						<p>
							<strong>
								{ __(
									'Layout:',
									'wordpress-template-news-blocks'
								) }
							</strong>{ ' ' }
							{ layoutLabel }
						</p>
					</div>
					<div className="wtn-blocks-news-section__editor-posts">
						<strong>
							{ __(
								'Matérias resolvidas:',
								'wordpress-template-news-blocks'
							) }
						</strong>

						<ol>
							{ slotLabels.map( ( slotLabel, slotIndex ) => {
								const post = resolvedPosts[ slotIndex ];
								const postId =
									computedResolvedPostIds[ slotIndex ];
								const source = slotSources[ slotIndex ];

								return (
									<li key={ slotLabel }>
										<strong>{ slotLabel }:</strong>{ ' ' }
										{ getResolvedPostLabel(
											post,
											isResolvingPosts
										) }
										{ postId > 0 && (
											<span className="wtn-blocks-news-section__editor-post-source">
												{ ' ' }
												—{ ' ' }
												{ source === 'manual'
													? __(
															'manual',
															'wordpress-template-news-blocks'
													  )
													: __(
															'automática',
															'wordpress-template-news-blocks'
													  ) }
											</span>
										) }
									</li>
								);
							} ) }
						</ol>
					</div>
				</Placeholder>
			</div>
		</>
	);
}

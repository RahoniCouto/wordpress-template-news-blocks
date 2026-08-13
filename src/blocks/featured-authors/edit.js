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
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, _n, sprintf } from '@wordpress/i18n';

import AuthorPicker from '../../components/author-picker';
import EditorialTextOverrideControl from '../../components/editorial-text-override-control';

const MAX_AUTHOR_COUNT = 5;
const AUTHOR_PHOTO_META_KEY = 'wtn_author_photo_id';
const AUTHOR_ROLE_META_KEY = 'wtn_author_editorial_role';

function normalizeAuthorCount( authorCount = 5 ) {
	const normalizedAuthorCount = Number( authorCount ) || 0;

	return [ 3, 4, 5 ].includes( normalizedAuthorCount )
		? normalizedAuthorCount
		: 5;
}

function normalizeAuthorIds( authorIds = [] ) {
	const normalizedAuthorIds = Array( MAX_AUTHOR_COUNT ).fill( 0 );
	const seenAuthorIds = new Set();
	const sourceAuthorIds = Array.isArray( authorIds ) ? authorIds : [];

	for ( let index = 0; index < MAX_AUTHOR_COUNT; index += 1 ) {
		const authorId = Number( sourceAuthorIds[ index ] ) || 0;

		if ( authorId <= 0 || seenAuthorIds.has( authorId ) ) {
			continue;
		}

		normalizedAuthorIds[ index ] = authorId;
		seenAuthorIds.add( authorId );
	}

	return normalizedAuthorIds;
}

function getAuthorName( author ) {
	if ( ! author?.name ) {
		return __( 'Autor sem nome', 'wordpress-template-news-blocks' );
	}

	return decodeEntities( author.name );
}

function getMediaImageUrl( media ) {
	return (
		media?.media_details?.sizes?.[ 'wtn-avatar' ]?.source_url ||
		media?.media_details?.sizes?.thumbnail?.source_url ||
		media?.media_details?.sizes?.medium?.source_url ||
		media?.source_url ||
		''
	);
}

function getAuthorAvatarUrl( author, editorialPhoto ) {
	return (
		getMediaImageUrl( editorialPhoto ) ||
		author?.avatar_urls?.[ '96' ] ||
		author?.avatar_urls?.[ '48' ] ||
		author?.avatar_urls?.[ '24' ] ||
		''
	);
}

function getAuthorInitials( authorName ) {
	const words = authorName
		.trim()
		.split( /\s+/ )
		.filter( Boolean )
		.slice( 0, 2 );

	return words.map( ( word ) => word.charAt( 0 ).toUpperCase() ).join( '' );
}

function FeaturedAuthorEditorCard( { author } ) {
	const authorId = Number( author?.id ) || 0;
	const photoId = Number( author?.meta?.[ AUTHOR_PHOTO_META_KEY ] ) || 0;
	const editorialRole =
		typeof author?.meta?.[ AUTHOR_ROLE_META_KEY ] === 'string'
			? author.meta[ AUTHOR_ROLE_META_KEY ].trim()
			: '';

	const postsQuery = useMemo(
		() => ( {
			author: authorId,
			per_page: 1,
			status: 'publish',
			_fields: 'id',
		} ),
		[ authorId ]
	);

	const { editorialPhoto, publishedPostCount, isResolvingPostCount } =
		useSelect(
			( select ) => {
				if ( ! authorId ) {
					return {
						editorialPhoto: null,
						publishedPostCount: null,
						isResolvingPostCount: false,
					};
				}

				const core = select( coreStore );

				core.getEntityRecords( 'postType', 'post', postsQuery );

				return {
					editorialPhoto: photoId
						? core.getEntityRecord( 'root', 'media', photoId )
						: null,
					publishedPostCount: core.getEntityRecordsTotalItems(
						'postType',
						'post',
						postsQuery
					),
					isResolvingPostCount: core.isResolving(
						'getEntityRecords',
						[ 'postType', 'post', postsQuery ]
					),
				};
			},
			[ authorId, photoId, postsQuery ]
		);

	const authorName = getAuthorName( author );
	const avatarUrl = getAuthorAvatarUrl( author, editorialPhoto );
	const authorInitials = getAuthorInitials( authorName );

	const postCountLabel =
		! isResolvingPostCount && Number.isInteger( publishedPostCount )
			? sprintf(
					/* translators: %d: number of published posts by the author. */
					_n(
						'%d matéria',
						'%d matérias',
						publishedPostCount,
						'wordpress-template-news-blocks'
					),
					publishedPostCount
			  )
			: __( 'Contando matérias…', 'wordpress-template-news-blocks' );

	return (
		<li className="wtn-blocks-featured-authors__item">
			<div className="wtn-blocks-featured-authors__author-card">
				<div
					className="wtn-blocks-featured-authors__avatar"
					aria-hidden="true"
				>
					{ avatarUrl ? (
						<img
							className="wtn-blocks-featured-authors__avatar-image"
							src={ avatarUrl }
							alt=""
						/>
					) : (
						<span className="wtn-blocks-featured-authors__avatar-fallback">
							{ authorInitials }
						</span>
					) }
				</div>

				<div className="wtn-blocks-featured-authors__content">
					<span className="wtn-blocks-featured-authors__name">
						{ authorName }
					</span>

					{ editorialRole && (
						<span className="wtn-blocks-featured-authors__role">
							{ decodeEntities( editorialRole ) }
						</span>
					) }

					<span className="wtn-blocks-featured-authors__post-count">
						{ postCountLabel }
					</span>
				</div>
			</div>
		</li>
	);
}

export default function Edit( { attributes, setAttributes } ) {
	const {
		authorIds = [ 0, 0, 0, 0, 0 ],
		authorCount = 5,
		titleOverride = '',
		showViewAll = false,
		viewAllUrl = '',
	} = attributes;

	const normalizedAuthorCount = normalizeAuthorCount( authorCount );
	const normalizedAuthorIds = useMemo(
		() => normalizeAuthorIds( authorIds ),
		[ authorIds ]
	);

	const configuredAuthorIds = useMemo(
		() =>
			normalizedAuthorIds
				.slice( 0, normalizedAuthorCount )
				.filter( ( authorId ) => authorId > 0 ),
		[ normalizedAuthorCount, normalizedAuthorIds ]
	);

	const selectedAuthorsQuery = useMemo( () => {
		if ( configuredAuthorIds.length === 0 ) {
			return null;
		}

		return {
			include: configuredAuthorIds,
			per_page: configuredAuthorIds.length,
			who: 'authors',
			has_published_posts: [ 'post' ],
			_fields: 'id,name,avatar_urls,meta',
		};
	}, [ configuredAuthorIds ] );

	const { selectedAuthors, isResolvingAuthors } = useSelect(
		( select ) => {
			if ( ! selectedAuthorsQuery ) {
				return {
					selectedAuthors: [],
					isResolvingAuthors: false,
				};
			}

			const core = select( coreStore );

			return {
				selectedAuthors:
					core.getEntityRecords(
						'root',
						'user',
						selectedAuthorsQuery
					) || [],
				isResolvingAuthors: core.isResolving( 'getEntityRecords', [
					'root',
					'user',
					selectedAuthorsQuery,
				] ),
			};
		},
		[ selectedAuthorsQuery ]
	);

	const selectedAuthorsById = useMemo(
		() =>
			new Map(
				selectedAuthors.map( ( author ) => [
					Number( author.id ),
					author,
				] )
			),
		[ selectedAuthors ]
	);

	const resolvedAuthors = useMemo(
		() =>
			configuredAuthorIds
				.map( ( authorId ) => selectedAuthorsById.get( authorId ) )
				.filter( Boolean ),
		[ configuredAuthorIds, selectedAuthorsById ]
	);

	const resolvedAuthorIds = useMemo(
		() =>
			new Set( resolvedAuthors.map( ( author ) => Number( author.id ) ) ),
		[ resolvedAuthors ]
	);

	const normalizedViewAllUrl =
		typeof viewAllUrl === 'string' ? viewAllUrl.trim() : '';

	const resolvedViewAllUrl = showViewAll ? normalizedViewAllUrl : '';
	const hasConfiguredAuthors = configuredAuthorIds.length > 0;
	const hasResolvedAuthors = resolvedAuthors.length > 0;
	const hasFewerAuthorsThanConfigured =
		! isResolvingAuthors &&
		hasResolvedAuthors &&
		resolvedAuthors.length < normalizedAuthorCount;

	const handleAuthorChange = ( slotIndex, nextAuthorId ) => {
		const normalizedNextAuthorId = Number( nextAuthorId ) || 0;

		if (
			normalizedNextAuthorId > 0 &&
			normalizedAuthorIds.some(
				( authorId, index ) =>
					index !== slotIndex && authorId === normalizedNextAuthorId
			)
		) {
			return;
		}

		const nextAuthorIds = [ ...normalizedAuthorIds ];
		nextAuthorIds[ slotIndex ] = normalizedNextAuthorId;

		setAttributes( {
			authorIds: nextAuthorIds,
		} );
	};

	const handleAuthorCountChange = ( nextAuthorCount ) => {
		const normalizedNextAuthorCount =
			normalizeAuthorCount( nextAuthorCount );
		const nextAuthorIds = normalizedAuthorIds.map( ( authorId, index ) =>
			index < normalizedNextAuthorCount ? authorId : 0
		);

		setAttributes( {
			authorCount: normalizedNextAuthorCount,
			authorIds: nextAuthorIds,
		} );
	};

	const blockProps = useBlockProps( {
		className: [
			'wtn-blocks-featured-authors',
			`wtn-blocks-featured-authors--count-${ normalizedAuthorCount }`,
		]
			.filter( Boolean )
			.join( ' ' ),
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __(
						'Autores em destaque',
						'wordpress-template-news-blocks'
					) }
					initialOpen
				>
					<RadioControl
						label={ __(
							'Quantidade de autores',
							'wordpress-template-news-blocks'
						) }
						selected={ String( normalizedAuthorCount ) }
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
						onChange={ handleAuthorCountChange }
						help={ __(
							'Ao reduzir a quantidade, os autores dos slots removidos também são removidos da configuração.',
							'wordpress-template-news-blocks'
						) }
					/>

					<div className="wtn-blocks-featured-authors__author-slots">
						{ Array.from(
							{ length: normalizedAuthorCount },
							( _, slotIndex ) => {
								const configuredAuthorId =
									normalizedAuthorIds[ slotIndex ] || 0;

								const excludeAuthorIds =
									normalizedAuthorIds.filter(
										( authorId, index ) =>
											index !== slotIndex && authorId > 0
									);

								const hasInvalidConfiguredAuthor =
									configuredAuthorId > 0 &&
									! isResolvingAuthors &&
									! resolvedAuthorIds.has(
										configuredAuthorId
									);

								return (
									<div
										key={ slotIndex }
										className="wtn-blocks-featured-authors__author-slot"
									>
										<AuthorPicker
											value={ configuredAuthorId }
											excludeAuthorIds={
												excludeAuthorIds
											}
											label={ sprintf(
												/* translators: %d: author position in the featured authors section. */
												__(
													'Autor %d',
													'wordpress-template-news-blocks'
												),
												slotIndex + 1
											) }
											onChange={ ( nextAuthorId ) => {
												handleAuthorChange(
													slotIndex,
													nextAuthorId
												);
											} }
											help={ __(
												'Selecione o autor que ocupará esta posição.',
												'wordpress-template-news-blocks'
											) }
										/>

										{ hasInvalidConfiguredAuthor && (
											<Notice
												status="warning"
												isDismissible={ false }
											>
												{ __(
													'O autor configurado neste slot não está mais disponível como autor elegível.',
													'wordpress-template-news-blocks'
												) }
											</Notice>
										) }
									</div>
								);
							}
						) }
					</div>

					<p className="wtn-blocks-featured-authors__inspector-help">
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
						help={ __(
							'O WordPress não possui uma listagem geral de autores neste projeto, então o destino é informado manualmente.',
							'wordpress-template-news-blocks'
						) }
					/>

					{ showViewAll && (
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
				<div className="wtn-blocks-featured-authors__header">
					<EditorialTextOverrideControl
						tagName="div"
						className="wtn-blocks-featured-authors__section-title"
						value={ titleOverride }
						fallbackValue={ __(
							'Nossos principais autores',
							'wordpress-template-news-blocks'
						) }
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
						<span className="wtn-blocks-featured-authors__view-all">
							{ __(
								'Ver todas',
								'wordpress-template-news-blocks'
							) }
						</span>
					) }
				</div>

				{ ! hasConfiguredAuthors && (
					<Notice status="info" isDismissible={ false }>
						{ __(
							'Selecione os autores em destaque nas configurações do bloco.',
							'wordpress-template-news-blocks'
						) }
					</Notice>
				) }

				{ isResolvingAuthors &&
					hasConfiguredAuthors &&
					! hasResolvedAuthors && (
						<div className="wtn-blocks-featured-authors__loading">
							<Spinner />
						</div>
					) }

				{ ! isResolvingAuthors &&
					hasConfiguredAuthors &&
					! hasResolvedAuthors && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'Nenhum autor elegível está disponível para esta configuração. O bloco não será exibido no frontend enquanto permanecer vazio.',
								'wordpress-template-news-blocks'
							) }
						</Notice>
					) }

				{ hasResolvedAuthors && (
					<ul className="wtn-blocks-featured-authors__items">
						{ resolvedAuthors.map( ( author ) => (
							<FeaturedAuthorEditorCard
								key={ author.id }
								author={ author }
							/>
						) ) }
					</ul>
				) }

				{ hasFewerAuthorsThanConfigured && (
					<p className="wtn-blocks-featured-authors__editor-summary">
						{ sprintf(
							/* translators: 1: number of valid authors, 2: configured number of authors. */
							__(
								'%1$d de %2$d autores válidos configurados.',
								'wordpress-template-news-blocks'
							),
							resolvedAuthors.length,
							normalizedAuthorCount
						) }
					</p>
				) }
			</section>
		</>
	);
}

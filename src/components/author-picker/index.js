import { ComboboxControl, Spinner } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

import './editor.scss';

function getAuthorLabel( author ) {
	if ( ! author?.name ) {
		return __( 'Autor sem nome', 'wordpress-template-news-blocks' );
	}

	return decodeEntities( author.name );
}

export default function AuthorPicker( {
	value = 0,
	onChange,
	label,
	help,
	excludeAuthorIds = [],
} ) {
	const [ searchTerm, setSearchTerm ] = useState( '' );

	const updateSearchTerm = useDebounce( ( nextSearchTerm ) => {
		setSearchTerm( nextSearchTerm );
	}, 250 );

	const normalizedValue = Number( value ) || 0;

	const normalizedExcludedAuthorIds = useMemo(
		() => [
			...new Set(
				excludeAuthorIds
					.map( ( authorId ) => Number( authorId ) || 0 )
					.filter(
						( authorId ) =>
							authorId > 0 && authorId !== normalizedValue
					)
			),
		],
		[ excludeAuthorIds, normalizedValue ]
	);

	const authorsQuery = useMemo(
		() => ( {
			per_page: 20,
			search: searchTerm,
			orderby: 'name',
			order: 'asc',
			who: 'authors',
			has_published_posts: [ 'post' ],
			_fields: 'id,name',
		} ),
		[ searchTerm ]
	);

	const { authors, selectedAuthor, isResolving } = useSelect(
		( select ) => {
			const core = select( coreStore );

			return {
				authors:
					core.getEntityRecords( 'root', 'user', authorsQuery ) || [],
				selectedAuthor: normalizedValue
					? core.getEntityRecord( 'root', 'user', normalizedValue )
					: null,
				isResolving: core.isResolving( 'getEntityRecords', [
					'root',
					'user',
					authorsQuery,
				] ),
			};
		},
		[ authorsQuery, normalizedValue ]
	);

	const options = authors
		.filter(
			( author ) =>
				! normalizedExcludedAuthorIds.includes( Number( author.id ) )
		)
		.map( ( author ) => ( {
			value: String( author.id ),
			label: getAuthorLabel( author ),
		} ) );

	if (
		selectedAuthor &&
		! options.some(
			( option ) => Number( option.value ) === normalizedValue
		)
	) {
		options.unshift( {
			value: String( selectedAuthor.id ),
			label: getAuthorLabel( selectedAuthor ),
		} );
	}

	return (
		<div className="wtn-blocks-author-picker">
			<ComboboxControl
				label={
					label ||
					__( 'Autor em destaque', 'wordpress-template-news-blocks' )
				}
				value={ normalizedValue ? String( normalizedValue ) : '' }
				options={ options }
				onChange={ ( nextValue ) => {
					onChange( nextValue ? Number( nextValue ) : 0 );
				} }
				onFilterValueChange={ ( nextSearchTerm ) => {
					updateSearchTerm( nextSearchTerm || '' );
				} }
				help={
					help ||
					__(
						'Busque e selecione um autor com matérias publicadas.',
						'wordpress-template-news-blocks'
					)
				}
			/>

			{ isResolving && (
				<div className="wtn-blocks-author-picker__loading">
					<Spinner />
				</div>
			) }
		</div>
	);
}

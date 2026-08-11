import { ComboboxControl, Spinner } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

import './editor.scss';

function getPostLabel( post ) {
	if ( ! post?.title?.rendered ) {
		return __( 'Matéria sem título', 'wordpress-template-news-blocks' );
	}

	return decodeEntities( post.title.rendered );
}

export default function PostPicker( {
	value = 0,
	onChange,
	label,
	help,
	categoryId = 0,
	excludePostIds = [],
} ) {
	const [ searchTerm, setSearchTerm ] = useState( '' );

	const updateSearchTerm = useDebounce( ( nextSearchTerm ) => {
		setSearchTerm( nextSearchTerm );
	}, 250 );

	const normalizedCategoryId = Number( categoryId ) || 0;
	const normalizedValue = Number( value ) || 0;

	const normalizedExcludedPostIds = useMemo(
		() => [
			...new Set(
				excludePostIds
					.map( ( postId ) => Number( postId ) || 0 )
					.filter(
						( postId ) => postId > 0 && postId !== normalizedValue
					)
			),
		],
		[ excludePostIds, normalizedValue ]
	);

	const postsQuery = useMemo( () => {
		const query = {
			per_page: 10,
			search: searchTerm,
			status: 'publish',
			orderby: 'date',
			order: 'desc',
			_fields: 'id,title',
		};

		if ( normalizedCategoryId > 0 ) {
			query.categories = [ normalizedCategoryId ];
		}

		if ( normalizedExcludedPostIds.length > 0 ) {
			query.exclude = normalizedExcludedPostIds;
		}

		return query;
	}, [ searchTerm, normalizedCategoryId, normalizedExcludedPostIds ] );

	const { posts, selectedPost, isResolving } = useSelect(
		( select ) => {
			const core = select( coreStore );

			return {
				posts:
					core.getEntityRecords( 'postType', 'post', postsQuery ) ||
					[],
				selectedPost: normalizedValue
					? core.getEntityRecord(
							'postType',
							'post',
							normalizedValue
					  )
					: null,
				isResolving: core.isResolving( 'getEntityRecords', [
					'postType',
					'post',
					postsQuery,
				] ),
			};
		},
		[ postsQuery, normalizedValue ]
	);

	const options = posts.map( ( post ) => ( {
		value: String( post.id ),
		label: getPostLabel( post ),
	} ) );

	if (
		selectedPost &&
		! options.some(
			( option ) => Number( option.value ) === normalizedValue
		)
	) {
		options.unshift( {
			value: String( selectedPost.id ),
			label: getPostLabel( selectedPost ),
		} );
	}

	return (
		<div className="wtn-blocks-post-picker">
			<ComboboxControl
				label={
					label ||
					__(
						'Matéria em destaque',
						'wordpress-template-news-blocks'
					)
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
						'Busque e selecione manualmente a matéria que será exibida no bloco.',
						'wordpress-template-news-blocks'
					)
				}
			/>

			{ isResolving && (
				<div className="wtn-blocks-post-picker__loading">
					<Spinner />
				</div>
			) }
		</div>
	);
}

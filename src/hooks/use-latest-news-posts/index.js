import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';

function normalizePostCount( postCount = 4 ) {
	const normalizedPostCount = Number( postCount ) || 0;

	return [ 3, 4, 5 ].includes( normalizedPostCount )
		? normalizedPostCount
		: 4;
}

function normalizePostIds( postIds = [] ) {
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

export default function useLatestNewsPosts( {
	categoryId = 0,
	postCount = 4,
	excludePostIds = [],
} ) {
	const normalizedCategoryId = Number( categoryId ) || 0;
	const normalizedPostCount = normalizePostCount( postCount );

	const normalizedExcludedPostIds = useMemo(
		() => normalizePostIds( excludePostIds ),
		[ excludePostIds ]
	);

	const requestData = useMemo(
		() => ( {
			categoryId: normalizedCategoryId,
			postCount: normalizedPostCount,
			excludedPostIds: normalizedExcludedPostIds,
		} ),
		[ normalizedCategoryId, normalizedExcludedPostIds, normalizedPostCount ]
	);

	const [ resolution, setResolution ] = useState( {
		resolvedPostIds: [],
		isResolving: true,
		hasError: false,
	} );

	useEffect( () => {
		let isActive = true;

		setResolution( {
			resolvedPostIds: [],
			isResolving: true,
			hasError: false,
		} );

		apiFetch( {
			path: '/wtn-blocks/v1/latest-news/resolve',
			method: 'POST',
			data: requestData,
		} )
			.then( ( response ) => {
				if ( ! isActive ) {
					return;
				}

				setResolution( {
					resolvedPostIds: normalizePostIds(
						response?.postIds
					).slice( 0, normalizedPostCount ),
					isResolving: false,
					hasError: false,
				} );
			} )
			.catch( () => {
				if ( ! isActive ) {
					return;
				}

				setResolution( {
					resolvedPostIds: [],
					isResolving: false,
					hasError: true,
				} );
			} );

		return () => {
			isActive = false;
		};
	}, [ normalizedPostCount, requestData ] );

	const resolvedPostIds = resolution.resolvedPostIds;

	const postsQuery = useMemo( () => {
		if ( resolvedPostIds.length === 0 ) {
			return null;
		}

		return {
			include: resolvedPostIds,
			per_page: resolvedPostIds.length,
			status: 'publish',
			orderby: 'include',
			_fields: 'id,title,featured_media,status,categories,date,link',
		};
	}, [ resolvedPostIds ] );

	const { resolvedPosts, isResolvingPostData } = useSelect(
		( select ) => {
			if ( ! postsQuery ) {
				return {
					resolvedPosts: [],
					isResolvingPostData: false,
				};
			}

			const core = select( coreStore );

			const entityRecordsArgs = [ 'postType', 'post', postsQuery ];

			const posts = core.getEntityRecords( ...entityRecordsArgs ) || [];

			const postsById = new Map(
				posts.map( ( post ) => [ Number( post.id ), post ] )
			);

			return {
				resolvedPosts: resolvedPostIds
					.map( ( postId ) => postsById.get( postId ) || null )
					.filter( Boolean ),
				isResolvingPostData: ! core.hasFinishedResolution(
					'getEntityRecords',
					entityRecordsArgs
				),
			};
		},
		[ postsQuery, resolvedPostIds ]
	);

	return {
		resolvedPostIds,
		resolvedPosts,
		isResolving: resolution.isResolving || isResolvingPostData,
		hasError: resolution.hasError,
	};
}

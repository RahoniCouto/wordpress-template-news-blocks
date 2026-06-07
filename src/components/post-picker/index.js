import { ComboboxControl, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useDebounce } from '@wordpress/compose';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

function getPostLabel(post) {
	if (!post?.title?.rendered) {
		return __('Matéria sem título', 'wordpress-template-news-blocks');
	}

	return decodeEntities(post.title.rendered);
}

export default function PostPicker({ value = 0, onChange, label }) {
	const [searchTerm, setSearchTerm] = useState('');

	const updateSearchTerm = useDebounce((nextSearchTerm) => {
		setSearchTerm(nextSearchTerm);
	}, 250);

	const postsQuery = useMemo(
		() => ({
			per_page: 10,
			search: searchTerm,
			status: 'publish',
			orderby: 'date',
			order: 'desc',
			_fields: 'id,title',
		}),
		[searchTerm]
	);

	const { posts, selectedPost, isResolving } = useSelect(
		(select) => {
			const core = select(coreStore);

			return {
				posts:
					core.getEntityRecords('postType', 'post', postsQuery) || [],
				selectedPost: value
					? core.getEntityRecord('postType', 'post', value)
					: null,
				isResolving: core.isResolving('getEntityRecords', [
					'postType',
					'post',
					postsQuery,
				]),
			};
		},
		[postsQuery, value]
	);

	const options = posts.map((post) => ({
		value: String(post.id),
		label: getPostLabel(post),
	}));

	if (
		selectedPost &&
		!options.some((option) => Number(option.value) === Number(value))
	) {
		options.unshift({
			value: String(selectedPost.id),
			label: getPostLabel(selectedPost),
		});
	}

	return (
		<div className="wtn-blocks-post-picker">
			<ComboboxControl
				label={
					label ||
					__('Matéria em destaque', 'wordpress-template-news-blocks')
				}
				value={value ? String(value) : ''}
				options={options}
				onChange={(nextValue) => {
					onChange(nextValue ? Number(nextValue) : 0);
				}}
				onFilterValueChange={(nextSearchTerm) => {
					updateSearchTerm(nextSearchTerm || '');
				}}
				help={__(
					'Busque e selecione manualmente a matéria que será exibida no bloco.',
					'wordpress-template-news-blocks'
				)}
			/>

			{isResolving && (
				<div className="wtn-blocks-post-picker__loading">
					<Spinner />
				</div>
			)}
		</div>
	);
}
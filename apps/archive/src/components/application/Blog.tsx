import type { JSX } from 'react';

const Blog = (): JSX.Element => {
    const handleAddBlogLink = (): void => {
        const blogLink = 'https://bo5mi.tistory.com/';
        window.open(blogLink, '_blank');
    };

    return (
        <div className="h-full w-full">
            <img src="./desktop/blog.png" onClick={() => handleAddBlogLink()} />
        </div>
    );
};

export default Blog;

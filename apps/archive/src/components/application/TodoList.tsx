import type { JSX } from 'react';

const TodoList = (): JSX.Element => {
    return (
        <div className="flex h-full w-full p-4">
            <ul>
                <ul>1. zustand 수정 - class to zustand</ul>
                <ul>2. resume 페이지 생성</ul>
                <ul>3. todolist 페이지 리팩토링</ul>
            </ul>
        </div>
    );
};

export default TodoList;

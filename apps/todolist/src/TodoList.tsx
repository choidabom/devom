"use client";

import "./index.css";

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

const todoItems: TodoItem[] = [
  { id: 1, text: "모노레포로 application 분리", completed: true },
  { id: 2, text: "github pages로 배포", completed: true },
  { id: 3, text: "tsconfig.json 수정", completed: true },
  {
    id: 4,
    text: "로컬 개발 환경에서 수정 시, 재빌드가 아닌 바로 반영되도록 하는 설정 찾기 in vite",
    completed: true,
  },
  { id: 5, text: "tsconfig 패키지로 분리", completed: true },
  { id: 6, text: "useWindowsize hook 리팩토링 및 hook 추가", completed: false },
  { id: 7, text: "class to context api", completed: true },
  { id: 8, text: "resume 페이지 생성", completed: false },
  { id: 9, text: "todolist 페이지 리팩토링 -----> still const..", completed: false },
  { id: 10, text: "biome 적용하기", completed: true },
  { id: 11, text: "screenshot updater", completed: true },
  { id: 12, text: "dev server 실험", completed: false },
  { id: 13, text: "useWindowControls hook 추가", completed: true },
];

function TodoList() {
  return (
    <div className="p-6 font-['NotoSansKorean']">
      <h1 className="text-xl mb-4 font-bold">To-Do list</h1>
      <ul aria-label="Todo items">
        {todoItems.map((item) => (
          <li key={item.id} className={item.completed ? "line-through" : ""}>
            {item.id}. {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;

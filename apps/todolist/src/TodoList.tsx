import "./index.css";

interface TodoItem {
  text: string;
  completed: boolean;
}

const todoItems: TodoItem[] = [
  { text: "모노레포로 application 분리", completed: true },
  { text: "github pages로 배포", completed: true },
  { text: "tsconfig.json 수정", completed: true },
  {
    text: "로컬 개발 환경에서 수정 시, 재빌드가 아닌 바로 반영되도록 하는 설정 찾기 in vite",
    completed: false,
  },
  { text: "tsconfig 패키지로 분리", completed: true },
  { text: "useWindowsize hook 리팩토링 및 hook 추가", completed: false },
  { text: "class to context api", completed: true },
  { text: "resume 페이지 생성", completed: false },
  { text: "todolist 페이지 리팩토링", completed: false },
];

function TodoList() {
  return (
    <div className="p-6 font-['NotoSansKorean']">
      <h1 className="text-xl mb-4 font-bold">To-Do list</h1>
      <ul aria-label="Todo items">
        {todoItems.map((item, index) => (
          <li key={index} className={item.completed ? "line-through" : ""}>
            {index}. {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;

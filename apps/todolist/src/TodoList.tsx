import "./index.css";

function TodoList() {
  return (
    <div className="p-6 font-['NotoSansKorean']">
      <h1 className="text-xl mb-4 font-bold">to do list</h1>
      <ul>
        <ul className="line-through">0. 모노레포로 application 분리</ul>
        <ul>1. zustand 수정 - class to zustand</ul>
        <ul>2. resume 페이지 생성</ul>
        <ul>3. todolist 페이지 리팩토링</ul>
      </ul>
    </div>
  );
}

export default TodoList;

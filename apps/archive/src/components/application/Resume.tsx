import type { JSX } from "react";

const Resume = (): JSX.Element => {
  return (
    <div className="bg-transparent">
      <img src="./image/devilwearsprada.png" alt="Book cover" className="max-w-s" />
      <div className="mx-auto min-w-[500px] max-w-[700px] px-4">
        <div className="p-6 font-['NotoSansKorean']">
          <h1 className="mb-4 text-3xl font-bold">Frontend Engineer</h1>
          Still writing ...
          <div className="flex flex-row items-center justify-center gap-4 p-4">
            <img src="./image/blog-rect.png" alt="Blog rectangle" className="w-1/2 object-contain" />
            <img src="./image/blog-vite.png" alt="Blog vite" className="w-1/2 object-contain" />
          </div>
          <div className="text-center text-xs text-gray-400">개발한 이미지 에디터를 활용하여 블로그 내 이미지들을 종종 만들었습니다. </div>
        </div>
      </div>
    </div>
  );
};

export default Resume;

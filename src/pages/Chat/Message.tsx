import ChatPage from '../../components/chat/ChatPage';
import PageMeta from '../../components/common/PageMeta';
import { Route, Routes } from 'react-router-dom';

export default function Message() {
  return (
    <>
      <PageMeta
        title="React.js Chat Page | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Chat Page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <ChatPage />
    </>
  );
}
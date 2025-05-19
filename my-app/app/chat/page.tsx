import ChatComponent from "../components/chat";

export default function Home() {
  return (
    <div>
      <div className="flex">
        <div className="w-full">
          <ChatComponent />
        </div>
      </div>
    </div>
  );
}

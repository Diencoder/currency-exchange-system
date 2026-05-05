export const renderChatView = () => {
    return `
    <div id="chat-view" class="fade-in">
        <div class="chat-container-pro section-card" style="padding: 0; display: grid; grid-template-columns: 350px 1fr; height: calc(100vh - 180px); overflow: hidden;">
            <!-- Chat Sidebar -->
            <div style="border-right: 1px solid var(--border-color); display: flex; flex-direction: column; background: rgba(0,0,0,0.1);">
                <div style="padding: 20px; border-bottom: 1px solid var(--border-color);">
                    <h3 style="font-size: 1.2rem; margin-bottom: 15px;">Support Chat</h3>
                    <div style="background: #2B3139; border-radius: 8px; padding: 8px 15px; display: flex; align-items: center; gap: 10px;">
                        <i data-lucide="search" style="width:16px; color:var(--text-secondary);"></i>
                        <input type="text" placeholder="Search chats..." style="background:transparent; border:none; color:white; outline:none; font-size: 0.85rem; width:100%;">
                    </div>
                </div>
                <div class="chat-list" style="flex: 1; overflow-y: auto;">
                    <div style="padding: 15px 20px; background: rgba(252, 213, 53, 0.05); border-left: 4px solid var(--primary); cursor: pointer;">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <div style="width: 48px; height: 48px; background: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: black; font-weight: 800;">AD</div>
                            <div style="flex: 1;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <h4 style="font-size: 0.95rem; margin:0;">Admin Support</h4>
                                    <span style="font-size: 0.7rem; color: var(--text-secondary);">10:15 AM</span>
                                </div>
                                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">How can I help you today?</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Active Chat Area -->
            <div style="display: flex; flex-direction: column; background: rgba(0,0,0,0.2);">
                <div style="padding: 15px 30px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2);">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <div style="width: 10px; height: 10px; background: var(--up-color); border-radius: 50%;"></div>
                        <h4 style="font-size: 1rem; margin:0;">Admin Support</h4>
                    </div>
                    <div style="display: flex; gap: 20px; color: var(--text-secondary);">
                        <i data-lucide="phone" style="width:18px; cursor:pointer;"></i>
                        <i data-lucide="video" style="width:18px; cursor:pointer;"></i>
                        <i data-lucide="more-vertical" style="width:18px; cursor:pointer;"></i>
                    </div>
                </div>

                <div id="message-container" style="flex: 1; padding: 30px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;">
                    <div style="align-self: flex-start; max-width: 70%;">
                        <div style="background: #2B3139; padding: 12px 18px; border-radius: 0 15px 15px 15px; font-size: 0.9rem;">
                            Hello! Welcome to our support. How can I assist you with your trade?
                        </div>
                        <span style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 5px; display: block;">Support • 10:15 AM</span>
                    </div>

                    <div style="align-self: flex-end; max-width: 70%;">
                        <div style="background: var(--primary); color: black; padding: 12px 18px; border-radius: 15px 15px 0 15px; font-size: 0.9rem; font-weight: 500;">
                            I have a question about my last P2P order.
                        </div>
                        <span style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 5px; display: block; text-align: right;">You • 10:16 AM</span>
                    </div>
                </div>

                <div style="padding: 20px 30px; border-top: 1px solid var(--border-color); background: rgba(0,0,0,0.1);">
                    <div style="background: #2B3139; border-radius: 12px; padding: 5px 15px; display: flex; align-items: center; gap: 15px;">
                        <i data-lucide="paperclip" style="width:20px; color:var(--text-secondary); cursor:pointer;"></i>
                        <input type="text" placeholder="Type your message here..." style="flex: 1; background:transparent; border:none; color:white; outline:none; padding: 12px 0;">
                        <button style="background: var(--primary); border:none; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                            <i data-lucide="send" style="width:18px; color:black;"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
};

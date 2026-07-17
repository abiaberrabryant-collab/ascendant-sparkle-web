import { createFileRoute } from "@tanstack/react-router";

const widget = String.raw`(() => {
  const script = document.currentScript;
  if (!script || window.__ascendantChatbotLoaded) return;
  window.__ascendantChatbotLoaded = true;
  const url = new URL(script.src);
  const key = url.searchParams.get("key");
  const api = url.origin + "/api/public";
  if (!key) return;

  fetch(api + "/client-chatbot?key=" + encodeURIComponent(key))
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((config) => {
      const host = document.createElement("div");
      host.id = "ascendant-chatbot";
      document.body.appendChild(host);
      const root = host.attachShadow({ mode: "open" });
      root.innerHTML = '<style>:host{all:initial;font-family:Arial,sans-serif;color:#111827}*{box-sizing:border-box}.launch{position:fixed;right:20px;bottom:20px;width:58px;height:58px;border:0;border-radius:50%;background:' + config.brandColor + ';color:#fff;cursor:pointer;font-size:25px;box-shadow:0 12px 30px #0004}.panel{display:none;position:fixed;right:20px;bottom:92px;width:min(380px,calc(100vw - 32px));height:520px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;box-shadow:0 20px 60px #0003;overflow:hidden;flex-direction:column}.panel.open{display:flex}.head{background:' + config.brandColor + ';color:#fff;padding:16px;font-weight:700}.sub{font-size:12px;opacity:.85;margin-top:4px}.messages{flex:1;overflow:auto;padding:14px;background:#f8fafc}.message{max-width:84%;padding:10px 12px;margin:0 0 10px;border-radius:14px;white-space:pre-wrap;line-height:1.4;font-size:14px}.bot{background:#eaf0f6}.user{margin-left:auto;background:' + config.brandColor + ';color:#fff}.form{display:flex;gap:8px;border-top:1px solid #e5e7eb;padding:10px}.input{flex:1;border:1px solid #d1d5db;border-radius:999px;padding:10px 12px;outline:none}.send,.lead{border:0;border-radius:999px;background:' + config.brandColor + ';color:#fff;padding:0 15px;cursor:pointer}.lead{margin:0 10px 10px;height:34px;font-size:12px}.lead-form{padding:10px;border-top:1px solid #e5e7eb;background:#fff}.lead-form input{width:100%;margin:0 0 7px;border:1px solid #d1d5db;border-radius:8px;padding:8px;font-size:12px}.lead-form button{width:100%;border:0;border-radius:8px;background:' + config.brandColor + ';color:#fff;padding:9px;cursor:pointer}</style><button class="launch" aria-label="Open chat">✦</button><section class="panel" aria-label="Chat with ' + config.businessName + '"><header class="head">' + config.businessName + '<div class="sub">Usually replies in a few seconds</div></header><div class="messages"></div><button class="lead" type="button">Request a callback</button><form class="lead-form" hidden><input name="name" placeholder="Your name" maxlength="120"/><input name="email" type="email" placeholder="Email address" required maxlength="255"/><input name="phone" placeholder="Phone (optional)" maxlength="40"/><button type="submit">Send my details</button></form><form class="form"><input class="input" placeholder="Ask a question…" maxlength="4000"/><button class="send" type="submit">Send</button></form></section>';
      const launch = root.querySelector(".launch"), panel = root.querySelector(".panel"), messages = root.querySelector(".messages"), form = root.querySelector(".form"), input = root.querySelector(".input"), leadButton = root.querySelector(".lead"), leadForm = root.querySelector(".lead-form");
      let conversationId = null, history = [];
      const add = (role, text) => { const node = document.createElement("div"); node.className = "message " + role; node.textContent = text; messages.appendChild(node); messages.scrollTop = messages.scrollHeight; return node; };
      launch.addEventListener("click", () => { panel.classList.toggle("open"); if (!history.length) { history = [{role:"assistant",content:config.greeting}]; add("bot", config.greeting); } });
      form.addEventListener("submit", async (event) => {
        event.preventDefault(); const text = input.value.trim(); if (!text) return;
        input.value = ""; input.disabled = true; history.push({role:"user",content:text}); add("user", text); const reply = add("bot", "…");
        try { const response = await fetch(api + "/client-chat?key=" + encodeURIComponent(key), {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key,conversationId,pageUrl:location.href,messages:history.slice(-12)})}); if (!response.ok || !response.body) throw new Error(); conversationId = response.headers.get("X-Conversation-Id") || conversationId; const reader=response.body.getReader(), decoder=new TextDecoder(); let textReply=""; while(true){const {value,done}=await reader.read();if(done)break;textReply+=decoder.decode(value,{stream:true});reply.textContent=textReply;messages.scrollTop=messages.scrollHeight;} history.push({role:"assistant",content:textReply}); } catch { reply.textContent = "Sorry, I couldn't send that. Please try again."; } finally { input.disabled=false; input.focus(); }
      });
      leadButton.addEventListener("click", () => { leadForm.hidden = !leadForm.hidden; });
      leadForm.addEventListener("submit", async (event) => {
        event.preventDefault(); const fields = new FormData(leadForm); const submit = leadForm.querySelector("button"); submit.disabled = true;
        try { const response = await fetch(api + "/client-chat?key=" + encodeURIComponent(key), {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key,conversationId,pageUrl:location.href,lead:{name:fields.get("name"),email:fields.get("email"),phone:fields.get("phone")}})}); if (!response.ok) throw new Error(); const data = await response.json(); conversationId = data.conversationId || conversationId; leadForm.innerHTML = "<strong>Thanks — we’ll be in touch soon.</strong>"; } catch { const email = leadForm.querySelector('[name="email"]'); email.setCustomValidity("Please enter a valid email and try again."); email.reportValidity(); } finally { submit.disabled = false; }
      });
    }).catch(() => {});
})();`;

export const Route = createFileRoute("/api/public/widget.js")({
  server: {
    handlers: {
      GET: async () => new Response(widget, {
        headers: {
          "content-type": "application/javascript; charset=utf-8",
          "cache-control": "public, max-age=300",
          "access-control-allow-origin": "*",
        },
      }),
    },
  },
});

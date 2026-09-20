"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function AccountPanel({ onClose }: { onClose: () => void }) {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(e.currentTarget);
    const credentials = { email: String(form.get("email")).trim(), password: String(form.get("password")) };
    try {
      const { data, error } = signup ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo: window.location.origin } }) : await supabase.auth.signInWithPassword(credentials);
      if (error) { setMessage(signup ? "Não foi possível cadastrar. Confira os dados e tente novamente." : "Não foi possível entrar. Confira seu e-mail, senha e confirmação de cadastro."); return; }
      if (data.session) onClose();
      else setMessage("Confira seu e-mail para confirmar o cadastro. Depois volte aqui e entre com sua senha.");
    } catch { setMessage("Falha de conexão. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <div className="modal-shell" role="dialog" aria-modal="true" aria-label="Sua conta">
    <button className="modal-backdrop" onClick={onClose} aria-label="Fechar" />
    <div className="checkout-modal account-panel"><button className="icon-button modal-close" onClick={onClose} aria-label="Fechar">×</button>
      <h2>{signup ? "Criar conta" : "Entrar na sua conta"}</h2>
      <form onSubmit={submit} className="account-form">
        <label>E-mail<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>
        <label>Senha<input name="password" type="password" minLength={8} required autoComplete={signup ? "new-password" : "current-password"}/></label>
        <button className="primary-button" disabled={busy}>{busy ? "Aguarde…" : signup ? "Cadastrar" : "Entrar"}</button>
      </form>
      <p role="status">{message}</p>
      <button className="link-button" onClick={() => { setSignup(!signup); setMessage(""); }}>{signup ? "Já tenho conta" : "Criar uma conta"}</button>
    </div>
  </div>;
}

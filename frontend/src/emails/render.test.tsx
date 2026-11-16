import assert from "node:assert/strict";
import test from "node:test";
import { render } from "@react-email/render";
import ClaimCodeEmail from "./ClaimCodeEmail";
import ContactEmail from "./ContactEmail";
import NewsletterEmail from "./NewsletterEmail";
import PasswordResetEmail from "./PasswordResetEmail";
import ReservationEmail from "./ReservationEmail";

// Guards React Email upgrades: every template must still render to HTML with its content.
test("every email template renders", async () => {
  const cases = [
    [ClaimCodeEmail({ code: "123456", businessName: "Pizza Roma" }), "123456"],
    [ContactEmail({ name: "Ana", email: "ana@example.ch", subject: "Hello", message: "Question" }), "Question"],
    [NewsletterEmail({ email: "ana@example.ch" }), "<html"],
    [PasswordResetEmail({ resetUrl: "https://foodeez.ch/reset?token=abc" }), "https://foodeez.ch/reset?token=abc"],
    [ReservationEmail({ name: "Ana", email: "ana@example.ch", phone: "+41", date: "2026-12-01", time: "19:00", guests: "2", businessName: "Pizza Roma" }), "Pizza Roma"],
  ] as const;
  for (const [element, expected] of cases) {
    const html = await render(element);
    assert.match(html, /<html/i);
    assert.ok(html.includes(expected), `missing ${expected}`);
  }
});

"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useRef } from "react";
import { MapPin, Phone, X } from "lucide-react";

export function ContactDialogTrigger({
  children = "查看联系方式",
  className = "button button-primary",
}: {
  children?: ReactNode;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        onClick={() => dialogRef.current?.showModal()}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        className="site-dialog contact-dialog"
        aria-labelledby="contact-dialog-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        onClose={() => triggerRef.current?.focus()}
      >
        <div className="dialog-sheet">
          <button className="dialog-close" type="button" onClick={close} aria-label="关闭联系方式">
            <X aria-hidden="true" size={20} />
          </button>
          <span className="section-kicker">CONTACT · 联系我们</span>
          <h2 id="contact-dialog-title">AI科瑞特青少儿科创机器人编程</h2>
          <div className="contact-details">
            <p><MapPin aria-hidden="true" /><span>徐汇区浦北路1077号2楼</span></p>
            <p><MapPin aria-hidden="true" /><span>上海市徐汇区龙文路69号2层</span></p>
            <p><Phone aria-hidden="true" /><a href="tel:19921536568">19921536568</a></p>
          </div>
          <div className="contact-qr-grid">
            <figure>
              <Image src="/media/krt/contact-wechat.png" alt="详情微信咨询二维码" width={712} height={712} />
              <figcaption><strong>详情微信咨询</strong><span>使用微信扫一扫</span></figcaption>
            </figure>
            <figure>
              <Image src="/media/krt/contact-official-account.png" alt="AI 科瑞特微信公众号二维码" width={712} height={712} />
              <figcaption><strong>关注公众号</strong><span>获取课程与活动动态</span></figcaption>
            </figure>
          </div>
        </div>
      </dialog>
    </>
  );
}

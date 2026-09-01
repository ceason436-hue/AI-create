import { InquiryForm } from "@/components/inquiry-form";
import { PublicPage } from "@/components/public-page";

export default function ConsultPage() { return <PublicPage eyebrow="TALK TO US" title="从孩子的兴趣，找到合适的下一步" intro="课程咨询和校园合作进入统一线索后台。没有短信和在线支付时，我们不会虚构验证码或自动签约。"><section className="public-content consult-grid"><div className="consult-info"><span className="eyebrow dark">COURSE INQUIRY</span><h2>告诉我们三个信息</h2><div className="consult-points"><p><b>01</b>孩子现在几年级？</p><p><b>02</b>对音乐、绘画、编程、机器人或项目挑战更感兴趣什么？</p><p><b>03</b>希望在线下、线上还是学校场景开始？</p></div><p>真实联系方式和咨询处理人由运营后台配置，正式上线前再补充。</p></div><div className="form-card"><InquiryForm /></div></section></PublicPage>; }

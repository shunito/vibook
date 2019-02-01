---
title: "こーど"
date: 2019-01-27T19:07:10+09:00
draft: false
weight: 10
lang: ""
writingMode: "horizontal-tb"
include_toc: true
dendenFuture: false
---

## こーど ##

{{< highlight javascript >}}cont a = "NNN";{{< / highlight >}}

こーどです

{{< highlight javascript "hl_lines=6,linenostart=199" >}}
cont a = "NNN";
// コメント

/*
  コメントブロックです。
  長いコメント

  たまにページをまたぐハイライトが妙なことろで生き別れになるのなんでだろう。

  空行もあり
*/

function(){
  let i;
  for(i=0;i<10;i++){
    console.log("あいうえお");
  }
}

a = b;
// end

for(){
  var int= 0;
  console.log("あいうえお");
}

var json = {
  "name" : "Shunsuke Ito",
  "mail" : "shunsuke@test.jp",
};
{{< / highlight >}}


{{< math class="fullWidth" >}}
\[
  \frac{\pi}{2} =
  \left( \int_{0}^{\infty} \frac{\sin x}{\sqrt{x}} dx \right)^2 =
  \sum_{k=0}^{\infty} \frac{(2k)!}{2^{2k}(k!)^2} \frac{1}{2k+1} =
  \prod_{k=1}^{\infty} \frac{4k^2}{4k^2 - 1}
\]
{{< / math >}}

{{< math class="width50P" >}}
  When \(a \ne 0\), there are two solutions to \(ax^2 + bx + c = 0\) and they are
  $$x = {-b \pm \sqrt{b^2-4ac} \over 2a}.$$
{{< / math >}}

{{< math >}}
\begin{align}
\mathcal{M}(u_{h}) - \mathcal{M}(u)
& = \mathcal{M}(u_{h} - u)\\
& = a^{*}(z, u_{h} - u)\\
& = a(u_{h} - u, z)\\
& = a(u_{h}, z) - a(u, z)\\
& = a(u_{h}, z) - L(z)\\
& = r(z),
\end{align}
{{< / math >}}

{{< math >}}
\[
{\tiny a-b} \\
{\normalsize a- b} \\
{\LARGE a - b} \\
\]
{{< / math >}}
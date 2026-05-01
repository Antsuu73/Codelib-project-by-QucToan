/**
 * app_knowledge.js — Codelib Knowledge Page
 * 
 * Nguồn tài liệu (phi thương mại, ghi công):
 *  - C++    : LearnCpp.com (https://www.learncpp.com)
 *  - Python : W3Schools   (https://www.w3schools.com/python)
 *  - Pascal : TutorialsPoint (https://www.tutorialspoint.com/pascal/index.html)
 */

(() => {
  /* ─── Utils ─── */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  const SESSION_KEY      = "codelib.session";
  const SESSION_KEY_TEMP = "codelib.session.temp";
  const KL_PROGRESS_KEY  = "codelib.knowledge.progress";

  const safeJson = (raw, fallback) => {
    try { const v = JSON.parse(raw); return v ?? fallback; } catch { return fallback; }
  };

  const getSession = () => {
    const p = safeJson(localStorage.getItem(SESSION_KEY), null);
    if (p?.email) return p;
    const t = safeJson(sessionStorage.getItem(SESSION_KEY_TEMP), null);
    if (t?.email) return t;
    return null;
  };

  /* ─── Auth guard ─── */
  const session = getSession();
  if (!session) {
    window.location.replace("../Login and register/html/login.html");
    return;
  }

  const email = String(session.email || "").trim().toLowerCase();
  const name  = String(session.fullname || session.username || "Bạn học");
  const avatarEl = $("#avatarText");
  if (avatarEl) avatarEl.textContent = (name.trim()[0] || "A").toUpperCase();

  $("#logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY_TEMP);
    window.location.href = "../Login and register/html/login.html";
  });

  /* ─── Progress persistence ─── */
  const getProgress = () => {
    const all = safeJson(localStorage.getItem(KL_PROGRESS_KEY), {});
    return all && typeof all === "object" ? all : {};
  };
  const saveProgress = (data) => {
    localStorage.setItem(KL_PROGRESS_KEY, JSON.stringify(data));
  };
  const isLessonDone = (lang, lessonId) => {
    const prog = getProgress();
    return !!(prog[email]?.[lang]?.[lessonId]);
  };
  const markLessonDone = (lang, lessonId) => {
    const prog = getProgress();
    if (!prog[email]) prog[email] = {};
    if (!prog[email][lang]) prog[email][lang] = {};
    prog[email][lang][lessonId] = Date.now();
    saveProgress(prog);
  };

  /* ─────────────────────────────────────────
     UTILITIES
  ───────────────────────────────────────── */

    /* ── Syntax highlight helper ── */
  const highlightText = (code, rules) => {
    let text = esc(code);
    const tokens = [];

    const placeholder = (html) => {
      const idx = tokens.length;
      tokens.push(html);
      return `@@TOK${idx}@@`;
    };

    rules.forEach(({ regex, handler }) => {
      text = text.replace(regex, (...args) => placeholder(handler(...args)));
    });

    return text.replace(/@@TOK(\d+)@@/g, (_, idx) => tokens[Number(idx)]);
  };

  const hl = {
    cpp(code) {
      return highlightText(code, [
        { regex: /\/\/.*$/gm, handler: m => `<span class="tok-cmt">${m}</span>` },
        { regex: /\/\*[\s\S]*?\*\//g, handler: m => `<span class="tok-cmt">${m}</span>` },
        { regex: /#\w+[^\n]*/g, handler: m => `<span class="tok-pp">${m}</span>` },
        { regex: /\b(int|char|float|double|bool|void|long|short|unsigned|const|auto|string|std::string)\b/g, handler: m => `<span class="tok-type">${m}</span>` },
        { regex: /\b(return|if|else|for|while|do|break|continue|switch|case|class|struct|namespace|using|new|delete|nullptr|true|false|include|this|public|private|protected|virtual|override)\b/g, handler: m => `<span class="tok-kw">${m}</span>` },
        { regex: /\b([a-zA-Z_]\w*)\s*(?=\()/g, handler: (m, name) => `<span class="tok-fn">${name}</span>` },
        { regex: /"([^"\\]|\\.)*"/g, handler: m => `<span class="tok-str">${m}</span>` },
        { regex: /\b(\d+\.?\d*)\b/g, handler: (m, num) => `<span class="tok-num">${num}</span>` }
      ]);
    },
    python(code) {
      return highlightText(code, [
        { regex: /#.*/g, handler: m => `<span class="tok-cmt">${m}</span>` },
        { regex: /\b(def|class|return|if|elif|else|for|while|break|continue|import|from|as|pass|in|not|and|or|True|False|None|print|input|len|range|type|int|str|float|list|dict|tuple|set)\b/g, handler: m => `<span class="tok-kw">${m}</span>` },
        { regex: /\b([a-zA-Z_]\w*)\s*(?=\()/g, handler: (m, name) => `<span class="tok-fn">${name}</span>` },
        { regex: /("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, handler: m => `<span class="tok-str">${m}</span>` },
        { regex: /\b(\d+\.?\d*)\b/g, handler: (m, num) => `<span class="tok-num">${num}</span>` }
      ]);
    },
    pascal(code) {
      return highlightText(code, [
        { regex: /\{[^}]*\}/g, handler: m => `<span class="tok-cmt">${m}</span>` },
        { regex: /\(\*[\s\S]*?\*\)/g, handler: m => `<span class="tok-cmt">${m}</span>` },
        { regex: /\b(program|begin|end|var|const|type|procedure|function|if|then|else|while|do|for|to|downto|repeat|until|uses|writeln|write|readln|read|true|false|integer|real|boolean|char|string|array|record|of|div|mod|and|or|not|array|in)\b/gi, handler: m => `<span class="tok-kw">${m}</span>` },
        { regex: /\b([A-Za-z_]\w*)\s*(?=\()/g, handler: (m, name) => `<span class="tok-fn">${name}</span>` },
        { regex: /'([^']*)'/g, handler: m => `<span class="tok-str">${m}</span>` },
        { regex: /\b(\d+\.?\d*)\b/g, handler: (m, num) => `<span class="tok-num">${num}</span>` }
      ]);
    }
  };
/* ── Code block builder ── */
  const codeBlock = (code, lang = "cpp", filename = "main") => {
    const highlighted = hl[lang] ? hl[lang](code) : esc(code);
    const id = "cb_" + Math.random().toString(36).slice(2, 8);
    return `
<div class="kl-code-wrap">
  <div class="kl-code-header">
    <div class="kl-dots">
      <span class="kl-dot-red"></span>
      <span class="kl-dot-yellow"></span>
      <span class="kl-dot-green"></span>
    </div>
    <span class="kl-code-filename">${filename}</span>
    <button class="kl-code-copy" data-copy-id="${id}">Copy</button>
  </div>
  <pre class="kl-pre" id="${id}">${highlighted}</pre>
</div>`;
  };

  /* ── Info/tip/warn box ── */
  const infoBox = (type, icon, html) =>
    `<div class="kl-info ${type}"><i class="fa-solid ${icon} kl-info-icon"></i><div>${html}</div></div>`;

  /* ── Credit box ── */
  const creditBox = (lang, url) =>
    `<div class="kl-source"><i class="fa-solid fa-book"></i><span>Tài liệu: <a href="${url}" target="_blank">${lang}</a></span></div>`;

  /* ══════════════════════════════════════════════
     C++ CURRICULUM
  ══════════════════════════════════════════════ */
  const CPP_CURRICULUM = [
    {
      section: "I. Introduction",
      id: "intro",
      lessons: [
        {
          id: "cpp-overview",
          title: "C++ Language Overview",
          content: () => `
<div class="kl-article-title">C++ Language Overview</div>
<div class="kl-article-lead">
  C++ là ngôn ngữ lập trình bậc cao, đa mục đích được tạo ra bởi Bjarne Stroustrup
  như một phần mở rộng của C. Nó nổi tiếng với hiệu năng cao và sức mạnh trong
  việc cung cấp các lớp trừu tượng bậc cao.
</div>

<div class="kl-section-title">Key Features</div>
<div class="kl-features">
  <div class="kl-feature-card">
    <div class="kl-feature-icon"><i class="fa-solid fa-bolt"></i></div>
    <h6>Performance</h6>
    <p>Thao tác bộ nhớ cấp thấp và hiệu quả cao cho các ứng dụng hệ thống quan trọng.</p>
  </div>
  <div class="kl-feature-card">
    <div class="kl-feature-icon"><i class="fa-solid fa-cubes"></i></div>
    <h6>Object-Oriented</h6>
    <p>Hỗ trợ class, kế thừa, và đa hình để xây dựng hệ thống phần mềm phức tạp.</p>
  </div>
  <div class="kl-feature-card">
    <div class="kl-feature-icon"><i class="fa-solid fa-book-open"></i></div>
    <h6>STL Library</h6>
    <p>Thư viện chuẩn cung cấp cấu trúc dữ liệu và thuật toán mạnh mẽ.</p>
  </div>
</div>

<div class="kl-section-title">Hello World</div>
${codeBlock(`#include <iostream>

int main() {
    std::cout << "Hello, CodeLib!" << std::endl;
    return 0;
}`, "cpp", "main.cpp")}

<p>Lệnh <code>#include &lt;iostream&gt;</code> nạp thư viện nhập/xuất. <code>std::cout</code> là luồng xuất chuẩn.</p>

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/introduction-to-these-tutorials/")}
`
        },
        {
          id: "cpp-variables",
          title: "Variables & Data Types",
          content: () => `
<div class="kl-article-title">Variables & Data Types</div>
<div class="kl-article-lead">Biến lưu trữ dữ liệu. Mỗi biến có tên, kiểu dữ liệu và giá trị.</div>

<div class="kl-section-title">Kiểu dữ liệu cơ bản</div>
${codeBlock(`#include <iostream>

int main() {
    int age = 20;          // Số nguyên
    double gpa = 3.75;     // Số thực
    char grade = 'A';      // Ký tự
    bool passed = true;    // Boolean
    std::string name = "CodeLib";

    std::cout << "Tên: " << name << std::endl;
    return 0;
}`, "cpp", "types.cpp")}

<div class="kl-prose">
  <ul>
    <li><code>int</code> — số nguyên (4 bytes)</li>
    <li><code>float</code> — số thực 4 bytes</li>
    <li><code>double</code> — số thực 8 bytes</li>
    <li><code>char</code> — ký tự (1 byte)</li>
    <li><code>bool</code> — true/false</li>
    <li><code>std::string</code> — chuỗi ký tự</li>
  </ul>
</div>

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/introduction-to-variables/")}
`
        }
      ]
    },
    {
      section: "II. Control Flow",
      id: "flow",
      lessons: [
        {
          id: "cpp-strings",
          title: "Strings & I/O",
          content: () => `
<div class="kl-article-title">Strings & Input/Output</div>
<div class="kl-article-lead">Xử lý chuỗi và nhập xuất là kỹ năng thiết yếu khi xây dựng chương trình C++.</div>

<div class="kl-section-title">Std::string</div>
${codeBlock(`#include <iostream>
#include <string>

int main() {
    std::string name;
    std::cout << "Nhập tên của bạn: ";
    std::getline(std::cin, name);
    std::cout << "Xin chào, " << name << "!\n";
    return 0;
}`, "cpp", "io.cpp")}

<div class="kl-prose">
  <p><code>std::getline</code> đọc chuỗi có khoảng trắng, phù hợp khi nhập họ tên hoặc câu trả lời đầy đủ.</p>
  <p><code>std::string</code> xử lý chuỗi an toàn hơn so với mảng <code>char</code>, giúp tránh tràn bộ nhớ.</p>
</div>

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/basic-input-output/")}
`
        },
        {
          id: "cpp-conditionals",
          title: "If / Else",
          content: () => `
<div class="kl-article-title">If / Else Statements</div>

${codeBlock(`int score = 85;

if (score >= 90) {
    std::cout << "Xuất sắc";
} else if (score >= 70) {
    std::cout << "Khá giỏi";
} else {
    std::cout << "Cần cố gắng";
}`, "cpp", "if_else.cpp")}

<div class="kl-prose">
  <p>Cấu trúc <code>if</code> cho phép chương trình quyết định nhánh thực thi dựa trên điều kiện. <code>else if</code> dùng để kiểm tra thêm nhiều trường hợp.</p>
  <p>Khi điều kiện không thỏa, khối <code>else</code> sẽ chạy mặc định.</p>
</div>

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/if-statements-and-blocks/")}
`
        },
        {
          id: "cpp-loops",
          title: "Loops",
          content: () => `
<div class="kl-article-title">For & While Loops</div>

<div class="kl-section-title">For Loop</div>
${codeBlock(`for (int i = 1; i <= 5; i++) {
    std::cout << i << " ";  // 1 2 3 4 5
}`, "cpp", "for.cpp")}

<div class="kl-section-title">While Loop</div>
${codeBlock(`int n = 1;
while (n <= 5) {
    std::cout << n * n << " ";  // 1 4 9 16 25
    n++;
}`, "cpp", "while.cpp")}

<div class="kl-prose">
  <p><code>for</code> phù hợp khi bạn biết trước số lần lặp. <code>while</code> dùng khi điều kiện lặp được kiểm tra trước mỗi lần chạy.</p>
  <p>Lưu ý tăng giá trị biến điều khiển trong vòng lặp, nếu không sẽ gây ra vòng lặp vô hạn.</p>
</div>

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/for-statements/")}
`
        }
      ]
    },
    {
      section: "III. Functions & Arrays",
      id: "advanced",
      lessons: [
        {
          id: "cpp-functions",
          title: "Functions",
          content: () => `
<div class="kl-article-title">Functions</div>

${codeBlock(`int add(int a, int b) {
    return a + b;
}

int main() {
    std::cout << add(3, 4);  // 7
    return 0;
}`, "cpp", "func.cpp")}

<div class="kl-prose">
  <p>Hàm giúp tái sử dụng mã và phân tách chức năng rõ ràng. Tham số truyền vào và giá trị trả về định nghĩa cách hàm hoạt động.</p>
  <p>Trong C++, hàm <code>main</code> là điểm bắt đầu của chương trình.</p>
</div>

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/introduction-to-functions/")}
`
        },
        {
          id: "cpp-arrays",
          title: "Arrays & Vectors",
          content: () => `
<div class="kl-article-title">Arrays & Vectors</div>

<div class="kl-section-title">Static Array</div>
${codeBlock(`int arr[5] = {1, 2, 3, 4, 5};
for (int i = 0; i < 5; i++) {
    std::cout << arr[i] << " ";
}`, "cpp", "array.cpp")}

<div class="kl-section-title">Vector (Dynamic)</div>
${codeBlock(`#include <vector>

std::vector<int> v = {1, 2, 3};
v.push_back(4);
std::cout << v.size();  // 4`, "cpp", "vector.cpp")}

<div class="kl-prose">
  <p><code>std::vector</code> là mảng động trong C++. Bạn có thể thêm phần tử trong lúc chạy bằng <code>push_back</code>.</p>
  <p>Thư viện STL gồm nhiều cấu trúc dữ liệu như <code>vector</code>, <code>map</code>, <code>set</code> hỗ trợ xây dựng chương trình hiệu quả.</p>
</div>

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/introduction-to-std-arrays/")}
`
        },
        {
          id: "cpp-recursion",
          title: "Recursion",
          content: () => `
<div class="kl-article-title">Recursion</div>
<div class="kl-article-lead">Đệ quy là kỹ thuật hàm gọi lại chính nó để giải bài toán theo từng bước nhỏ hơn.</div>

<div class="kl-section-title">Giai thừa & Fibonacci</div>
${codeBlock(`#include <iostream>

int factorial(int n) {
    if (n <= 1) return 1;          // Base case
    return n * factorial(n - 1);   // Recursive call
}

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    std::cout << "5! = " << factorial(5) << std::endl;  // 120
    std::cout << "fib(7) = " << fibonacci(7) << std::endl; // 13
    return 0;
}`, "cpp", "recursion.cpp")}

${infoBox("tip", "fa-lightbulb", "Mọi hàm đệ quy cần <strong>base case</strong> (điều kiện dừng) để không lặp vô hạn. Nếu quên base case, chương trình sẽ bị <em>stack overflow</em>.")}

<div class="kl-section-title">Tháp Hà Nội</div>
${codeBlock(`void hanoi(int n, char from, char to, char aux) {
    if (n == 1) {
        std::cout << "Di chuyển đĩa 1 từ " << from << " sang " << to << "\\n";
        return;
    }
    hanoi(n-1, from, aux, to);
    std::cout << "Di chuyển đĩa " << n << " từ " << from << " sang " << to << "\\n";
    hanoi(n-1, aux, to, from);
}

int main() {
    hanoi(3, 'A', 'C', 'B');
    return 0;
}`, "cpp", "hanoi.cpp")}

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/recursion/")}
`
        }
      ]
    },
    {
      section: "IV. Pointers & References",
      id: "cpp-ptrs",
      lessons: [
        {
          id: "cpp-pointers",
          title: "Pointers",
          content: () => `
<div class="kl-article-title">Pointers</div>
<div class="kl-article-lead">Pointer lưu địa chỉ bộ nhớ của một biến khác. Đây là tính năng mạnh mẽ và đặc trưng của C++.</div>

${codeBlock(`#include <iostream>

int main() {
    int x = 42;
    int* ptr = &x;    // ptr trỏ đến địa chỉ của x

    std::cout << x     << std::endl;  // 42  (giá trị)
    std::cout << &x    << std::endl;  // địa chỉ của x
    std::cout << ptr   << std::endl;  // địa chỉ (giống &x)
    std::cout << *ptr  << std::endl;  // 42  (dereference)

    *ptr = 100;   // thay đổi x thông qua con trỏ
    std::cout << x << std::endl;  // 100
    return 0;
}`, "cpp", "pointer.cpp")}

<div class="kl-section-title">Con trỏ và mảng</div>
${codeBlock(`int arr[] = {10, 20, 30, 40};
int* p = arr;   // trỏ vào phần tử đầu tiên

for (int i = 0; i < 4; i++) {
    std::cout << *(p + i) << " ";  // pointer arithmetic
}`, "cpp", "ptr_array.cpp")}

${infoBox("warn", "fa-triangle-exclamation", "Luôn khởi tạo con trỏ trước khi dùng. Con trỏ chưa khởi tạo (<em>dangling pointer</em>) gây lỗi nguy hiểm.")}

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/introduction-to-pointers/")}
`
        },
        {
          id: "cpp-references",
          title: "References & Dynamic Memory",
          content: () => `
<div class="kl-article-title">References & Dynamic Memory</div>

<div class="kl-section-title">References</div>
${codeBlock(`#include <iostream>

void swap(int& a, int& b) {   // truyền tham chiếu
    int temp = a;
    a = b;
    b = temp;
}

int main() {
    int x = 5, y = 10;
    swap(x, y);
    std::cout << x << " " << y;  // 10 5
    return 0;
}`, "cpp", "ref.cpp")}

<div class="kl-section-title">Dynamic Memory (new / delete)</div>
${codeBlock(`#include <iostream>

int main() {
    int* p = new int(99);     // cấp phát trên heap
    std::cout << *p << std::endl;
    delete p;                 // giải phóng bộ nhớ
    p = nullptr;

    int* arr = new int[5]{1,2,3,4,5};
    for (int i = 0; i < 5; i++) std::cout << arr[i] << " ";
    delete[] arr;
    return 0;
}`, "cpp", "dynamic.cpp")}

${infoBox("warn", "fa-triangle-exclamation", "Mỗi <code>new</code> phải có <code>delete</code> tương ứng để tránh <strong>memory leak</strong>.")}

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/dynamic-memory-allocation-with-new-and-delete/")}
`
        }
      ]
    },
    {
      section: "V. Object-Oriented Programming",
      id: "cpp-oop",
      lessons: [
        {
          id: "cpp-classes",
          title: "Classes & Objects",
          content: () => `
<div class="kl-article-title">Classes & Objects</div>
<div class="kl-article-lead">Class là khuôn mẫu để tạo đối tượng. OOP giúp tổ chức code theo thực thể thực tế.</div>

${codeBlock(`#include <iostream>
#include <string>

class Student {
private:
    std::string name;
    int age;
    double gpa;

public:
    // Constructor
    Student(std::string n, int a, double g) : name(n), age(a), gpa(g) {}

    // Getter
    std::string getName() const { return name; }
    double getGpa()       const { return gpa; }

    // Method
    void display() const {
        std::cout << name << " | " << age << " tuổi | GPA: " << gpa << std::endl;
    }
};

int main() {
    Student s1("An", 20, 3.8);
    Student s2("Bình", 21, 3.5);
    s1.display();
    s2.display();
    return 0;
}`, "cpp", "class.cpp")}

${infoBox("info", "fa-circle-info", "<strong>Encapsulation</strong>: dữ liệu <code>private</code> chỉ truy cập qua <code>public</code> method, giúp bảo vệ tính toàn vẹn của dữ liệu.")}

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/introduction-to-object-oriented-programming/")}
`
        },
        {
          id: "cpp-inheritance",
          title: "Inheritance & Polymorphism",
          content: () => `
<div class="kl-article-title">Inheritance & Polymorphism</div>

<div class="kl-section-title">Kế thừa</div>
${codeBlock(`#include <iostream>
#include <string>

class Animal {
protected:
    std::string name;
public:
    Animal(std::string n) : name(n) {}
    virtual void speak() {
        std::cout << name << " nói..." << std::endl;
    }
};

class Dog : public Animal {
public:
    Dog(std::string n) : Animal(n) {}
    void speak() override {
        std::cout << name << ": Gâu gâu!" << std::endl;
    }
};

class Cat : public Animal {
public:
    Cat(std::string n) : Animal(n) {}
    void speak() override {
        std::cout << name << ": Meo meo!" << std::endl;
    }
};

int main() {
    Animal* pets[] = { new Dog("Rex"), new Cat("Mimi") };
    for (auto* p : pets) p->speak();   // Polymorphism
    for (auto* p : pets) delete p;
    return 0;
}`, "cpp", "inherit.cpp")}

${infoBox("tip", "fa-lightbulb", "Dùng <code>virtual</code> + <code>override</code> để hàm con được gọi đúng lúc runtime — đây là <strong>runtime polymorphism</strong>.")}

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/introduction-to-inheritance/")}
`
        },
        {
          id: "cpp-stl",
          title: "STL: map, set, algorithm",
          content: () => `
<div class="kl-article-title">STL: map, set & algorithm</div>
<div class="kl-article-lead">Standard Template Library cung cấp cấu trúc dữ liệu và thuật toán sẵn có, cực kỳ hiệu quả.</div>

<div class="kl-section-title">std::map</div>
${codeBlock(`#include <map>
#include <iostream>

int main() {
    std::map<std::string, int> scores;
    scores["An"]   = 95;
    scores["Bình"] = 87;
    scores["Chi"]  = 92;

    for (auto& [name, score] : scores) {
        std::cout << name << ": " << score << "\\n";
    }
    return 0;
}`, "cpp", "map.cpp")}

<div class="kl-section-title">std::set</div>
${codeBlock(`#include <set>

std::set<int> nums = {3, 1, 4, 1, 5, 9, 2, 6};
// tự loại trùng và sắp xếp: {1,2,3,4,5,6,9}
for (int n : nums) std::cout << n << " ";`, "cpp", "set.cpp")}

<div class="kl-section-title">std::sort & std::find</div>
${codeBlock(`#include <algorithm>
#include <vector>

std::vector<int> v = {5, 2, 8, 1, 9, 3};
std::sort(v.begin(), v.end());           // {1,2,3,5,8,9}
auto it = std::find(v.begin(), v.end(), 8);
if (it != v.end())
    std::cout << "Tìm thấy 8 tại index " << (it - v.begin());`, "cpp", "algo.cpp")}

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/introduction-to-the-stl/")}
`
        }
      ]
    },
    {
      section: "VI. File I/O & Error Handling",
      id: "cpp-files",
      lessons: [
        {
          id: "cpp-fileio",
          title: "File I/O",
          content: () => `
<div class="kl-article-title">File Input / Output</div>
<div class="kl-article-lead">C++ đọc/ghi file qua thư viện <code>&lt;fstream&gt;</code>.</div>

${codeBlock(`#include <iostream>
#include <fstream>
#include <string>

int main() {
    // Ghi file
    std::ofstream out("data.txt");
    out << "Xin chào CodeLib!\\n";
    out << "Dòng thứ hai\\n";
    out.close();

    // Đọc file
    std::ifstream in("data.txt");
    std::string line;
    while (std::getline(in, line)) {
        std::cout << line << "\\n";
    }
    in.close();
    return 0;
}`, "cpp", "fileio.cpp")}

${infoBox("tip", "fa-lightbulb", "Luôn kiểm tra <code>if (file.is_open())</code> trước khi đọc/ghi để tránh lỗi runtime khi file không tồn tại.")}

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/basic-file-io/")}
`
        },
        {
          id: "cpp-exceptions",
          title: "Exception Handling",
          content: () => `
<div class="kl-article-title">Exception Handling</div>
<div class="kl-article-lead">Xử lý ngoại lệ giúp chương trình không bị crash khi gặp lỗi không mong muốn.</div>

${codeBlock(`#include <iostream>
#include <stdexcept>

double divide(double a, double b) {
    if (b == 0)
        throw std::invalid_argument("Không chia được cho 0!");
    return a / b;
}

int main() {
    try {
        std::cout << divide(10, 2) << std::endl;  // 5
        std::cout << divide(5, 0)  << std::endl;  // throw!
    }
    catch (const std::invalid_argument& e) {
        std::cerr << "Lỗi: " << e.what() << std::endl;
    }
    catch (...) {
        std::cerr << "Lỗi không xác định!" << std::endl;
    }
    std::cout << "Chương trình tiếp tục..." << std::endl;
    return 0;
}`, "cpp", "exception.cpp")}

${infoBox("info", "fa-circle-info", "Khối <code>try</code> chứa code có thể lỗi. <code>catch</code> bắt và xử lý lỗi. <code>catch(...)</code> bắt mọi loại ngoại lệ.")}

${creditBox("C++", "https://www.learncpp.com/cpp-tutorial/basic-exception-handling/")}
`
        }
      ]
    }
  ];

  /* ══════════════════════════════════════════════
     PYTHON CURRICULUM
  ══════════════════════════════════════════════ */
  const PYTHON_CURRICULUM = [
    {
      section: "I. Getting Started",
      id: "py-start",
      lessons: [
        {
          id: "py-intro",
          title: "Python Introduction",
          content: () => `
<div class="kl-article-title">Python Introduction</div>
<div class="kl-article-lead">Python là ngôn ngữ thông dịch với cú pháp đơn giản. Phổ biến trong web, AI, và data science.</div>

<div class="kl-features">
  <div class="kl-feature-card">
    <div class="kl-feature-icon"><i class="fa-solid fa-feather"></i></div>
    <h6>Easy Syntax</h6>
    <p>Cú pháp gần giống tiếng Anh, dễ học cho người mới.</p>
  </div>
  <div class="kl-feature-card">
    <div class="kl-feature-icon"><i class="fa-solid fa-brain"></i></div>
    <h6>AI & ML</h6>
    <p>NumPy, Pandas, TensorFlow — ecosystem mạnh nhất cho machine learning.</p>
  </div>
  <div class="kl-feature-card">
    <div class="kl-feature-icon"><i class="fa-solid fa-globe"></i></div>
    <h6>Versatile</h6>
    <p>Web (Django), scripting, automation, game dev — Python làm tất cả.</p>
  </div>
</div>

<div class="kl-section-title">Hello World</div>
${codeBlock(`print("Hello, CodeLib!")
print("Python version:", 3)`, "python", "hello.py")}

${creditBox("Python", "https://www.w3schools.com/python/python_intro.asp")}
`
        },
        {
          id: "py-variables",
          title: "Variables & Types",
          content: () => `
<div class="kl-article-title">Variables & Data Types</div>
<div class="kl-article-lead">Python tự suy luận kiểu dữ liệu — bạn không cần khai báo kiểu.</div>

${codeBlock(`name = "CodeLib"     # str
age = 20             # int
gpa = 3.75           # float
is_student = True    # bool

print(type(name))   # <class 'str'>
print(type(age))    # <class 'int'>`, "python", "vars.py")}

<div class="kl-section-title">String</div>
${codeBlock(`name = "Python"
greeting = f"Xin chào, {name}!"
print(greeting)
print(len(name))      # 6
print(name.upper())   # PYTHON`, "python", "string.py")}

<div class="kl-section-title">List, Dict, Tuple</div>
${codeBlock(`# List
fruits = ["táo", "cam", "xoài"]
fruits.append("chuối")
print(fruits[0])

# Dict
student = {"name": "An", "age": 20}
print(student["name"])

# Tuple (không thay đổi)
point = (3, 4)`, "python", "collections.py")}

${creditBox("Python", "https://www.w3schools.com/python/python_variables.asp")}
`
        }
      ]
    },
    {
      section: "II. Control Flow",
      id: "py-flow",
      lessons: [
        {
          id: "py-conditions",
          title: "Conditions",
          content: () => `
<div class="kl-article-title">If / Elif / Else</div>

${codeBlock(`score = 85

if score >= 90:
    print("Xuất sắc")
elif score >= 70:
    print("Khá giỏi")
else:
    print("Cần cố gắng")

# One-liner
grade = "Pass" if score >= 50 else "Fail"`, "python", "if.py")}

<div class="kl-prose">
  <p><code>if</code> là cấu trúc điều kiện cơ bản. <code>elif</code> cho phép kiểm tra nhiều tình huống, còn <code>else</code> xử lý phần còn lại.</p>
  <p>Câu lệnh mẫu một dòng với toán tử điều kiện giúp viết code ngắn gọn.</p>
</div>

${creditBox("Python", "https://www.w3schools.com/python/python_conditions.asp")}
`
        },
        {
          id: "py-loops",
          title: "Loops",
          content: () => `
<div class="kl-article-title">For & While Loops</div>

<div class="kl-section-title">For Loop</div>
${codeBlock(`# Duyệt list
for fruit in ["táo", "cam", "xoài"]:
    print(fruit)

# range()
for i in range(1, 6):
    print(i, end=" ")

# List comprehension
squares = [x**2 for x in range(1, 6)]`, "python", "for.py")}

<div class="kl-section-title">While Loop</div>
${codeBlock(`n = 1
while n <= 5:
    print(n, end=" ")
    n += 1`, "python", "while.py")}

<div class="kl-prose">
  <p><code>for</code> thường dùng để lặp qua dãy hoặc danh sách, còn <code>while</code> lặp trong khi điều kiện còn đúng.</p>
  <p>Hãy chú ý cập nhật biến điều khiển như <code>n += 1</code>, nếu không vòng lặp sẽ chạy mãi.</p>
</div>

${creditBox("Python", "https://www.w3schools.com/python/python_for_loops.asp")}
`
        }
      ]
    },
    {
      section: "III. Functions & OOP",
      id: "py-advanced",
      lessons: [
        {
          id: "py-functions",
          title: "Functions",
          content: () => `
<div class="kl-article-title">Functions</div>

${codeBlock(`def greet(name, greeting="Xin chào"):
    return f"{greeting}, {name}!"

print(greet("An"))
print(greet("Bình", "Hey"))

def total(*nums):
    return sum(nums)
print(total(1, 2, 3, 4))`, "python", "func.py")}

<div class="kl-prose">
  <p>Hàm giúp tái sử dụng logic nhiều lần. Tham số mặc định và tham số biến thể (<code>*args</code>) làm hàm linh động hơn.</p>
  <p>Dòng <code>print</code> chỉ ra cách gọi hàm và in kết quả ra màn hình.</p>
</div>

${creditBox("Python", "https://www.w3schools.com/python/python_functions.asp")}
`
        },
        {
          id: "py-files",
          title: "File I/O & Modules",
          content: () => `
<div class="kl-article-title">File I/O & Modules</div>
<div class="kl-article-lead">Đọc ghi file và dùng module giúp Python trở nên mạnh mẽ trong tự động hóa và xử lý dữ liệu.</div>

${codeBlock(`# Ghi file
with open('data.txt', 'w', encoding='utf-8') as f:
    f.write('Xin chào CodeLib!\n')

# Đọc file
with open('data.txt', 'r', encoding='utf-8') as f:
    content = f.read()
print(content)`, "python", "file_io.py")}

<div class="kl-section-title">Module chuẩn hay dùng</div>
${codeBlock(`import math
import datetime
import random

print(math.sqrt(144))         # 12.0
print(math.pi)                # 3.14159...
print(datetime.date.today())  # 2024-01-15
print(random.randint(1, 100)) # số ngẫu nhiên 1-100`, "python", "modules.py")}

<div class="kl-prose">
  <p><code>with open(...)</code> tự động đóng file sau khi hoàn thành. Tham số <code>encoding='utf-8'</code> đảm bảo hiển thị tiếng Việt chính xác.</p>
</div>

${creditBox("Python", "https://www.w3schools.com/python/python_file_handling.asp")}
`
        },
        {
          id: "py-classes",
          title: "Classes & OOP",
          content: () => `
<div class="kl-article-title">Classes & OOP</div>

${codeBlock(`class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} nói..."

class Dog(Animal):
    def speak(self):
        return f"{self.name}: Gâu gâu!"

dog = Dog("Rex")
print(dog.speak())`, "python", "oop.py")}

<div class="kl-section-title">Dunder Methods & Properties</div>
${codeBlock(`class Circle:
    def __init__(self, radius):
        self._radius = radius

    @property
    def area(self):
        import math
        return math.pi * self._radius ** 2

    def __str__(self):
        return f"Circle(r={self._radius})"

    def __repr__(self):
        return f"Circle({self._radius!r})"

c = Circle(5)
print(c)          # Circle(r=5)
print(c.area)     # 78.53...`, "python", "dunder.py")}

${creditBox("Python", "https://www.w3schools.com/python/python_classes.asp")}
`
        },
        {
          id: "py-lambda",
          title: "Lambda, Map & Filter",
          content: () => `
<div class="kl-article-title">Lambda, Map & Filter</div>
<div class="kl-article-lead">Lập trình hàm (functional programming) trong Python dùng lambda, map, filter để viết code ngắn gọn và biểu đạt.</div>

<div class="kl-section-title">Lambda</div>
${codeBlock(`# Hàm thông thường
def square(x):
    return x ** 2

# Lambda tương đương
square = lambda x: x ** 2

# Lambda nhiều tham số
add = lambda a, b: a + b
print(add(3, 4))   # 7`, "python", "lambda.py")}

<div class="kl-section-title">Map & Filter</div>
${codeBlock(`nums = [1, 2, 3, 4, 5, 6]

# map: áp dụng hàm cho mỗi phần tử
squares = list(map(lambda x: x**2, nums))
print(squares)  # [1, 4, 9, 16, 25, 36]

# filter: lọc phần tử thỏa điều kiện
evens = list(filter(lambda x: x % 2 == 0, nums))
print(evens)    # [2, 4, 6]

# sorted với key
students = [("An", 85), ("Bình", 92), ("Chi", 78)]
top = sorted(students, key=lambda s: s[1], reverse=True)
print(top)  # [("Bình",92), ("An",85), ("Chi",78)]`, "python", "map_filter.py")}

${infoBox("tip", "fa-lightbulb", "List comprehension thường được ưu tiên hơn <code>map/filter</code> vì dễ đọc hơn: <code>[x**2 for x in nums]</code>")}

${creditBox("Python", "https://www.w3schools.com/python/python_lambda.asp")}
`
        }
      ]
    },
    {
      section: "IV. Advanced Python",
      id: "py-extra",
      lessons: [
        {
          id: "py-exceptions",
          title: "Exception Handling",
          content: () => `
<div class="kl-article-title">Exception Handling</div>
<div class="kl-article-lead">Xử lý ngoại lệ giúp chương trình không bị dừng đột ngột khi gặp lỗi.</div>

${codeBlock(`# try / except / else / finally
def divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        print("Lỗi: Chia cho 0!")
        return None
    except TypeError as e:
        print(f"Lỗi kiểu: {e}")
        return None
    else:
        print("Tính toán thành công!")
        return result
    finally:
        print("Luôn chạy dòng này.")

print(divide(10, 2))   # 5.0
print(divide(5, 0))    # lỗi ZeroDivision`, "python", "exception.py")}

<div class="kl-section-title">Custom Exception</div>
${codeBlock(`class AgeError(Exception):
    def __init__(self, age):
        super().__init__(f"Tuổi không hợp lệ: {age}")
        self.age = age

def check_age(age):
    if age < 0 or age > 150:
        raise AgeError(age)
    return f"Tuổi hợp lệ: {age}"

try:
    print(check_age(200))
except AgeError as e:
    print(e)`, "python", "custom_exc.py")}

${creditBox("Python", "https://www.w3schools.com/python/python_try_except.asp")}
`
        },
        {
          id: "py-comprehension",
          title: "List & Dict Comprehension",
          content: () => `
<div class="kl-article-title">List & Dict Comprehension</div>
<div class="kl-article-lead">Comprehension là cách viết Python thuần túy — ngắn, rõ ràng, hiệu quả.</div>

<div class="kl-section-title">List Comprehension</div>
${codeBlock(`# Cơ bản
squares = [x**2 for x in range(1, 11)]

# Có điều kiện
evens = [x for x in range(20) if x % 2 == 0]

# Lồng nhau
matrix = [[i*j for j in range(1,4)] for i in range(1,4)]
# [[1,2,3],[2,4,6],[3,6,9]]

# Flatten nested list
flat = [x for row in matrix for x in row]`, "python", "listcomp.py")}

<div class="kl-section-title">Dict & Set Comprehension</div>
${codeBlock(`words = ["hello", "world", "python"]

# Dict comprehension
lengths = {w: len(w) for w in words}
# {'hello': 5, 'world': 5, 'python': 6}

# Set comprehension (loại trùng lặp)
chars = {c for w in words for c in w}

# Đảo key-value
inv = {v: k for k, v in lengths.items()}`, "python", "dictcomp.py")}

${infoBox("info", "fa-circle-info", "Generator expression <code>(x**2 for x in range(10))</code> tiết kiệm bộ nhớ hơn list comprehension khi chỉ cần duyệt một lần.")}

${creditBox("Python", "https://www.w3schools.com/python/python_lists_comprehension.asp")}
`
        },
        {
          id: "py-decorators",
          title: "Decorators & Generators",
          content: () => `
<div class="kl-article-title">Decorators & Generators</div>

<div class="kl-section-title">Decorators</div>
${codeBlock(`import time

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} chạy {end-start:.4f}s")
        return result
    return wrapper

@timer
def slow_sum(n):
    return sum(range(n))

slow_sum(1_000_000)  # slow_sum chạy 0.0423s`, "python", "decorator.py")}

<div class="kl-section-title">Generators</div>
${codeBlock(`# Generator function với yield
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

gen = fibonacci()
for _ in range(10):
    print(next(gen), end=" ")
# 0 1 1 2 3 5 8 13 21 34

# Generator expression
gen_sq = (x**2 for x in range(1000000))  # không tốn RAM!`, "python", "generator.py")}

${infoBox("tip", "fa-lightbulb", "<code>yield</code> làm hàm trở thành generator — trả về giá trị từng bước mà không nạp toàn bộ vào bộ nhớ.")}

${creditBox("Python", "https://www.w3schools.com/python/python_iterators.asp")}
`
        },
        {
          id: "py-json",
          title: "JSON & Regular Expressions",
          content: () => `
<div class="kl-article-title">JSON & Regular Expressions</div>

<div class="kl-section-title">JSON</div>
${codeBlock(`import json

# Python dict -> JSON string
data = {"name": "An", "age": 20, "scores": [90, 85, 92]}
json_str = json.dumps(data, ensure_ascii=False, indent=2)
print(json_str)

# JSON string -> Python dict
loaded = json.loads(json_str)
print(loaded["name"])   # An

# Đọc/ghi file JSON
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)`, "python", "json_demo.py")}

<div class="kl-section-title">Regular Expressions</div>
${codeBlock(`import re

text = "Email: test@codelib.vn, phone: 0912-345-678"

# Tìm email
emails = re.findall(r'[\w.+-]+@[\w-]+\.[a-z]{2,}', text)
print(emails)   # ['test@codelib.vn']

# Tìm số điện thoại
phones = re.findall(r'\d{4}-\d{3}-\d{3}', text)
print(phones)   # ['0912-345-678']

# Kiểm tra pattern
is_valid = bool(re.match(r'^[\w]+$', "CodeLib123"))`, "python", "regex.py")}

${creditBox("Python", "https://www.w3schools.com/python/python_regex.asp")}
`
        }
      ]
    }
  ];

  /* ══════════════════════════════════════════════
     PASCAL CURRICULUM
  ══════════════════════════════════════════════ */
  const PASCAL_CURRICULUM = [
    {
      section: "I. Introduction",
      id: "pas-intro",
      lessons: [
        {
          id: "pas-overview",
          title: "Pascal Overview",
          content: () => `
<div class="kl-article-title">Pascal Language</div>
<div class="kl-article-lead">
  Pascal được thiết kế bởi Niklaus Wirth năm 1970. Ngôn ngữ này dạy lập trình có cấu trúc tốt
  và phổ biến trong giáo dục tại Việt Nam.
</div>

<div class="kl-features">
  <div class="kl-feature-card">
    <div class="kl-feature-icon"><i class="fa-solid fa-graduation-cap"></i></div>
    <h6>Educational</h6>
    <p>Cú pháp rõ ràng buộc lập trình viên viết code có cấu trúc tốt.</p>
  </div>
  <div class="kl-feature-card">
    <div class="kl-feature-icon"><i class="fa-solid fa-shield"></i></div>
    <h6>Strongly Typed</h6>
    <p>Kiểm tra kiểu chặt chẽ giúp phát hiện lỗi sớm.</p>
  </div>
  <div class="kl-feature-card">
    <div class="kl-feature-icon"><i class="fa-solid fa-trophy"></i></div>
    <h6>Competitive</h6>
    <p>Được dùng trong kỳ thi Olympic Tin học quốc gia Việt Nam.</p>
  </div>
</div>

<div class="kl-section-title">Hello World</div>
${codeBlock(`program HelloWorld;
begin
  writeln('Hello, CodeLib!');
end.`, "pascal", "hello.pas")}

${creditBox("Pascal", "https://www.tutorialspoint.com/pascal/pascal_overview.htm")}
`
        },
        {
          id: "pas-variables",
          title: "Variables & Types",
          content: () => `
<div class="kl-article-title">Variables & Data Types</div>
<div class="kl-article-lead">Pascal yêu cầu khai báo biến trong khối <code>var</code> — ngôn ngữ strongly typed.</div>

${codeBlock(`program Variables;
var
  name : string;
  age : integer;
  gpa : real;
  passed : boolean;
begin
  name := 'CodeLib';
  age := 20;
  gpa := 3.75;
  passed := true;
  writeln('Tên: ', name);
  writeln('Tuổi: ', age);
end.`, "pascal", "vars.pas")}

<div class="kl-prose">
  <ul>
    <li><code>integer</code> — số nguyên</li>
    <li><code>real</code> — số thực</li>
    <li><code>boolean</code> — true/false</li>
    <li><code>char</code> — ký tự</li>
    <li><code>string</code> — chuỗi</li>
  </ul>
</div>

${creditBox("Pascal", "https://www.tutorialspoint.com/pascal/pascal_variable_types.htm")}
`
        }
      ]
    },
    {
      section: "II. Control Flow",
      id: "pas-flow",
      lessons: [
        {
          id: "pas-conditionals",
          title: "If Then Else",
          content: () => `
<div class="kl-article-title">If Then Else</div>

${codeBlock(`program IfDemo;
var score : integer;
begin
  score := 85;
  if score >= 90 then
    writeln('Xuất sắc')
  else if score >= 70 then
    writeln('Khá giỏi')
  else
    writeln('Cần cố gắng');
end.`, "pascal", "if.pas")}

<div class="kl-prose">
  <p>Pascal dùng câu lệnh <code>if</code> cùng với <code>then</code> và <code>else</code> để thực hiện nhánh theo điều kiện.</p>
  <p>Trong Pascal, phần <code>else</code> chỉ chạy khi tất cả điều kiện trước đó đều sai.</p>
</div>

${creditBox("Pascal", "https://www.tutorialspoint.com/pascal/pascal_decision_making.htm")}
`
        },
        {
          id: "pas-loops",
          title: "For / While Loops",
          content: () => `
<div class="kl-article-title">Loops</div>

<div class="kl-section-title">For Loop</div>
${codeBlock(`program ForDemo;
var i : integer;
begin
  for i := 1 to 5 do
    write(i, ' ');  { 1 2 3 4 5 }
  writeln;
  for i := 5 downto 1 do
    write(i, ' ');  { 5 4 3 2 1 }
end.`, "pascal", "for.pas")}

<div class="kl-section-title">While Loop</div>
${codeBlock(`program WhileDemo;
var n : integer;
begin
  n := 1;
  while n <= 5 do begin
    write(n * n, ' ');
    n := n + 1;
  end;
end.`, "pascal", "while.pas")}

<div class="kl-prose">
  <p><code>for</code> trong Pascal sử dụng <code>to</code> hoặc <code>downto</code> để lặp thuận hoặc ngược.</p>
  <p><code>while</code> lặp khi điều kiện còn đúng và cần cập nhật biến điều kiện trong khối <code>begin ... end</code>.</p>
</div>

${creditBox("Pascal", "https://www.tutorialspoint.com/pascal/pascal_loop_types.htm")}
`
        }
      ]
    },
    {
      section: "III. Procedures & Arrays",
      id: "pas-advanced",
      lessons: [
        {
          id: "pas-procedures",
          title: "Procedures",
          content: () => `
<div class="kl-article-title">Procedures</div>

${codeBlock(`program ProcDemo;

procedure Greet(name : string);
begin
  writeln('Xin chào, ', name, '!');
end;

begin
  Greet('CodeLib');
  Greet('Pascal');
end.`, "pascal", "proc.pas")}

${creditBox("Pascal", "https://www.tutorialspoint.com/pascal/pascal_procedures.htm")}
`
        },
        {
          id: "pas-functions",
          title: "Functions",
          content: () => `
<div class="kl-article-title">Functions</div>

${codeBlock(`program FuncDemo;

function Add(a, b : integer) : integer;
begin
  Add := a + b;
end;

function Factorial(n : integer) : integer;
begin
  if n <= 1 then
    Factorial := 1
  else
    Factorial := n * Factorial(n - 1);
end;

begin
  writeln('3 + 4 = ', Add(3, 4));
  writeln('5! = ', Factorial(5));
end.`, "pascal", "func.pas")}

<div class="kl-prose">
  <p>Hàm trong Pascal trả về giá trị bằng cách gán cho tên hàm. Đây là cách viết code gọn và dễ đọc khi chia nhỏ bài toán.</p>
  <p>Đệ quy là kỹ thuật hàm gọi lại chính nó, dùng tốt cho bài toán như tính giai thừa.</p>
</div>

${creditBox("Pascal", "https://www.tutorialspoint.com/pascal/pascal_functions.htm")}
`
        },
        {
          id: "pas-records",
          title: "Records & Case Statements",
          content: () => `
<div class="kl-article-title">Records & Case Statements</div>
<div class="kl-article-lead">Records giúp nhóm biến có liên quan, còn case chọn nhánh dựa trên giá trị.</div>

${codeBlock(`program RecordCaseDemo;

type
  Student = record
    name : string;
    age : integer;
    grade : char;
  end;

var
  s : Student;

begin
  s.name := 'An';
  s.age := 20;
  s.grade := 'A';
  writeln('Tên: ', s.name);
  writeln('Tuổi: ', s.age);

  case s.grade of
    'A': writeln('Xuất sắc');
    'B': writeln('Tốt');
    'C': writeln('Trung bình');
  else
    writeln('Khác');
  end;
end.`, "pascal", "record_case.pas")}

<div class="kl-prose">
  <p><code>record</code> cho phép bạn lưu nhiều giá trị liên quan trong một cấu trúc duy nhất, giống như object đơn giản.</p>
  <p><code>case</code> giúp chọn nhánh rõ ràng khi giá trị chỉ có nhiều khả năng rời rạc.</p>
</div>

${creditBox("Pascal", "https://www.tutorialspoint.com/pascal/pascal_records.htm")}
`
        }
      ]
    }
  ];

  /* ══════════════════════════════════════════════
     RENDER LOGIC
  ══════════════════════════════════════════════ */

  const CURRICULUM = { cpp: CPP_CURRICULUM, python: PYTHON_CURRICULUM, pascal: PASCAL_CURRICULUM };
  let currentLang = "cpp";

  /* ── Render sidebar ── */
  const renderSidebar = (lang) => {
    const nav = $("#sidebarNav");
    if (!nav) return;
    nav.innerHTML = "";

    const curr = CURRICULUM[lang];
    if (!curr) return;

    curr.forEach((section) => {
      const header = document.createElement("button");
      header.className = "kl-section-header";
      header.innerHTML = `<span>${section.section}</span><i class="fa-solid fa-chevron-down kl-chevron"></i>`;
      nav.appendChild(header);

      const container = document.createElement("div");
      section.lessons.forEach((lesson) => {
        const item = document.createElement("a");
        item.href = "#";
        item.className = "kl-nav-item";
        item.dataset.lessonId = lesson.id;

        const isDone = isLessonDone(lang, lesson.id);
        if (isDone) item.classList.add("done");

        item.innerHTML = `
          <span>${lesson.title}</span>
          <span class="kl-done-dot"></span>
        `;
        item.addEventListener("click", (e) => {
          e.preventDefault();
          document.querySelectorAll(".kl-nav-item").forEach(x => x.classList.remove("active"));
          item.classList.add("active");
          renderContent(lang, lesson);
        });
        container.appendChild(item);
      });

      nav.appendChild(container);
      header.addEventListener("click", () => {
        header.classList.toggle("collapsed");
        container.style.display = header.classList.contains("collapsed") ? "none" : "block";
      });
    });

    // Expand first section
    const firstHeader = nav.querySelector(".kl-section-header");
    if (firstHeader) {
      firstHeader.click();
    }
  };

  /* ── Render content ── */
  const renderContent = (lang, lesson) => {
    const area = $("#contentArea");
    if (!area) return;
    area.innerHTML = lesson.content();

    // Setup copy buttons
    document.querySelectorAll(".kl-code-copy").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.copyId;
        const code = document.getElementById(id);
        if (code) {
          const text = code.innerText;
          navigator.clipboard.writeText(text).then(() => {
            btn.classList.add("copied");
            btn.textContent = "Copied!";
            setTimeout(() => {
              btn.classList.remove("copied");
              btn.textContent = "Copy";
            }, 2000);
          });
        }
      });
    });

    // Setup complete button
    const completeBtn = area.querySelector(".kl-complete-btn");
    if (completeBtn) {
      const isDone = isLessonDone(lang, lesson.id);
      if (isDone) {
        completeBtn.classList.add("done");
        completeBtn.disabled = true;
      }
      completeBtn.addEventListener("click", () => {
        markLessonDone(lang, lesson.id);
        completeBtn.classList.add("done");
        completeBtn.disabled = true;
        const item = document.querySelector(`[data-lesson-id="${lesson.id}"]`);
        if (item) item.classList.add("done");
      });
    }
  };

  /* ── Language tab switching ── */
  document.querySelectorAll(".kl-lang-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".kl-lang-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentLang = tab.dataset.lang;

      const title = { cpp: "C++ Fundamentals", python: "Python Basics", pascal: "Pascal Essentials" };
      const masteryTitle = document.getElementById("masteryTitle");
      if (masteryTitle) masteryTitle.textContent = title[currentLang];

      renderSidebar(currentLang);
      const first = CURRICULUM[currentLang]?.[0]?.lessons?.[0];
      if (first) renderContent(currentLang, first);
    });
  });

  /* ── Initialize ── */
  renderSidebar(currentLang);
  const firstLesson = CURRICULUM[currentLang]?.[0]?.lessons?.[0];
  if (firstLesson) renderContent(currentLang, firstLesson);
})();
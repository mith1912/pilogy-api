# Overall numerology summary

`POST /api/v1/numerology/calculate` returns `data.overallSummary` alongside the existing numerical results and short interpretations. The summary is a Vietnamese symbolic reading intended for reflection. Its language and suggestions are framed as possibilities to explore.

The service reads the already-calculated indices and resolves their exact values in the validated Vietnamese interpretation catalog, including 11, 22 and 33 where supported. The authored overview rules cover three Life Path and Expression pairs. Other pairs connect the catalog themes through reflection prompts, with a dedicated phrasing when a theme repeats. The titles, Vietnamese templates and combination rules live in [overall-summary.vi.json](../lib/interpretations/overall/overall-summary.vi.json). The loader validates the content once at module initialization. `generateOverallSummary` in [lib/numerology/overall-summary.ts](../lib/numerology/overall-summary.ts) selects the rules and assembles the final text locally using exact-value articles. The nine existing article JSON files retain their own version.

| Section | Source and purpose |
| --- | --- |
| `overview` | Connects Life Path direction and Expression, using an authored combination when available. |
| `strengths` | Uses a Birthday theme as a supporting strength and an Expression action to try. |
| `challenges` | Pairs a Life Path challenge with its practical suggestion. |
| `innerSelf` | Relates Soul Urge motivation to the outward expression suggested by Personality. |
| `relationships` | Uses Personality as a cue for reflecting on communication, with a Soul Urge prompt. |
| `growthAdvice` | Offers a longer-term reflection anchored in Maturity. |
| `currentCycle` | Uses the Personal Year and Personal Month for the effective `referenceDate` and labels the selected period explicitly. |

Each present section has `title` and `content`. The `sourceIndices` array lists the exact index values used by the emitted sections. When a section is absent from the JSON or a source index is unavailable, the service omits the affected sections. The cycle can display the year or month on its own. `completeness.missingSections` lists omitted sections and `missingIndices` lists unavailable source indices. The existing Calculate error for a missing mandatory individual article still applies. Definitions still report coverage for the nine numerical indices, and summary QA checks all seven sections across the existing reachable-value fixture set.

## Generated response example

Send the Nguyễn Thị Mỹ Lan request in [Automatic Y classification](y-classification.md). The response excerpt contains the complete summary for the selected November 2026 period.

```json
{
  "overallSummary": {
    "version": "1.0.0",
    "locale": "vi",
    "title": "Tổng luận thần số học",
    "overview": {
      "title": "Tổng quan bản thân",
      "content": "Có những nét tính cách dường như xuất hiện trong nhiều khía cạnh cuộc sống của bạn. Chủ đề năng lực tổ chức cùng hiện diện ở Số chủ đạo và Số biểu đạt, gợi ý rằng điều bạn hướng tới và cách bạn thể hiện có thể mang một dấu ấn chung. Đôi khi chính những phẩm chất quen thuộc nhất lại là điều chúng ta ít nhận ra ở bản thân. Khám phá sâu hơn hai chỉ số này có thể mang đến một góc nhìn thú vị về con người bạn."
    },
    "challenges": {
      "title": "Thử thách cần lưu ý",
      "content": "Ai cũng có những khuynh hướng vừa giúp mình tiến lên, vừa đôi lúc khiến bản thân chững lại. Với Số chủ đạo của bạn, một chủ đề đáng suy ngẫm là dễ tự đánh giá qua thành tích hoặc sự công nhận. Điều đó không định nghĩa con người bạn, mà mở ra cơ hội nhìn nhận những phản ứng quen thuộc từ một góc khác. Một gợi ý nhỏ để bắt đầu là: Nhìn lại cả điều đã học và mối quan hệ đã xây, bên cạnh kết quả đạt được."
    },
    "strengths": {
      "title": "Điểm mạnh nổi bật",
      "content": "Có những khả năng bạn sử dụng rất tự nhiên, đến mức đôi khi quên rằng đó cũng có thể là điểm mạnh của mình. Chủ đề khả năng lắng nghe từ Số ngày sinh gợi mở một phẩm chất đáng khám phá trong cách bạn phát huy Số biểu đạt. Một hướng để nhận ra phẩm chất ấy rõ hơn là: Xác định một mục tiêu cụ thể và một giới hạn giúp bạn giữ cân bằng. Biết đâu điều khiến bạn khác biệt lại bắt đầu từ những gì vốn rất quen thuộc."
    },
    "innerSelf": {
      "title": "Nội tâm và động lực",
      "content": "Có bao giờ bạn cảm thấy người khác nhìn nhận mình khác với con người thật bên trong? Số linh hồn gợi mở những mong muốn gắn với tinh thần khám phá, còn Số nhân cách phản ánh sắc thái khả năng biểu đạt trong cách bạn hiện diện. Sự khác biệt ấy không nhất thiết là mâu thuẫn, mà có thể là những lớp tính cách cùng tồn tại. Hiểu cả hai sẽ giúp bạn có thêm góc nhìn về điều mình cần và cách mình bộc lộ điều đó."
    },
    "relationships": {
      "title": "Mối quan hệ và giao tiếp",
      "content": "Trong các mối quan hệ, điều người khác cảm nhận về bạn đôi khi chỉ là một phần của câu chuyện. Số nhân cách gợi lên chủ đề khả năng biểu đạt, trong khi Số linh hồn giúp soi chiếu những mong muốn riêng ít được nói thành lời. Có lẽ một câu hỏi đáng dành thời gian suy ngẫm là: Bạn đang tìm một cơ hội mới, hay đang né một điều cần đối diện? Bởi sự kết nối sâu sắc thường bắt đầu từ việc hiểu cả người khác lẫn chính mình."
    },
    "growthAdvice": {
      "title": "Định hướng phát triển",
      "content": "Bạn không cần trở thành một con người hoàn toàn khác để trưởng thành. Đôi khi, sự thay đổi bắt đầu từ việc hiểu rõ hơn những phẩm chất mình đã có. Số trưởng thành gợi mở hành trình phát triển gắn với suy ngẫm, như một hướng tham khảo cho những chặng đường phía trước. Một câu hỏi có thể giúp bạn nhìn sâu hơn là: Điều gì bạn đang cố phân tích, trong khi có lẽ cần cảm nhận trước?"
    },
    "currentCycle": {
      "title": "Nhịp điệu của kỳ đã chọn",
      "content": "Mỗi giai đoạn cuộc sống đều có những điều khiến chúng ta quan tâm nhiều hơn. Theo góc nhìn thần số học, năm 2026 mang chủ đề năng lực tổ chức, gợi ra một hướng để bạn nhìn lại những ưu tiên của mình. Đây không phải dự đoán về điều chắc chắn sẽ xảy ra, mà là một lăng kính để suy ngẫm về hành trình cá nhân. Trong bức tranh của cả năm, mỗi tháng lại mở ra một góc nhìn riêng. Tháng 11/2026 gợi lên chủ đề tinh thần độc lập, có thể giúp bạn chú ý hơn đến một khía cạnh trong cuộc sống. Một điều nhỏ đáng thử trong giai đoạn này là: Khởi động một việc bạn đã trì hoãn, rồi mời một người góp ý trước khi đi quá xa. Đôi khi, những thay đổi đáng nhớ bắt đầu từ cách ta nhìn nhận các việc rất bình thường."
    },
    "sourceIndices": [
      {
        "type": "lifePath",
        "value": 8
      },
      {
        "type": "expression",
        "value": 8
      },
      {
        "type": "birthday",
        "value": 2
      },
      {
        "type": "soulUrge",
        "value": 5
      },
      {
        "type": "personality",
        "value": 3
      },
      {
        "type": "maturity",
        "value": 7
      },
      {
        "type": "personalYear",
        "value": 8
      },
      {
        "type": "personalMonth",
        "value": 1
      }
    ],
    "contentVersion": "v1.1.0",
    "completeness": {
      "missingSections": [],
      "missingIndices": []
    }
  }
}
```

## Versioning and performance

`version` identifies the summary response format. `overallSummary.contentVersion` identifies the copy, combination rules, and source selection used to compose it. Bump it for copy or synthesis changes and when a source catalog update changes the generated summary. The outer `data.contentVersion` continues to identify the individual interpretation catalog.

Calculate sends `Cache-Control: no-store`. For an explicitly saved local result, store both content versions, the summary format version, the effective reference date, locale, calculation version, effective Y mode and classification rules version with the input identity. Keep the mode and rules version distinct so a legacy result and an auto result cannot accidentally share an identity.

Before the JSON migration, a local warm measurement on Node 22.23.4 (x86-64) reused the 101 domain witnesses and the initialized catalog. Seven batches of 101,000 summary generations had a median batch-average cost of about 4.6 µs per summary. This isolates generation from calculation, cold start, JSON serialization, and HTTP handling.

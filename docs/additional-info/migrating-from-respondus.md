---
hide:
    - toc
---

# Migrating from Respondus

Qcon improves upon Respondus in two important ways:

- **it runs entirely in your browser**, which makes it available to everyone, not just those who run Windows, and your file is never uploaded to a server
- **correct answers have the asterisk *after* the list number**

Qcon has other benefits like answer key answers for FIB, MAT, and ORD-type questions, no *Type: ...* requirements, and better error messaging, but we'll stop there and let you discover Qcon's usefulness at your own pace!

Here are some examples of the differences between Qcon and Respondus:

## Multiple Choice (MC)

> Respondus only imports MC questions when using plain text or an *answer key*.

| Qcon                                | Respondus                          |
|:-----------------------------------:|:----------------------------------:|
| ![comparison-mc-inline-qcon](../assets/comparison-ms-inline-qcon.png){ width="300" } | ![comparison-mc-inline-plain](../assets/comparison-ms-inline-plain.png){ width="380" } |

## Multiple Select (MS)

> Respondus only imports MS questions when using plain text or an *answer key*.

| Qcon                                | Respondus                          |
|:-----------------------------------:|:----------------------------------:|
| ![comparison-mc-inline-qcon](../assets/comparison-ms-inline-qcon.png){ width="300" } | ![comparison-mc-inline-plain](../assets/comparison-ms-inline-plain.png){ width="380" } |

## Fill-in-blank (FIB)

> Respondus only imports FIB questions when specifying answers inline.

| Qcon | Respondus |
|:-------------:|:----------:|
![comparison-fib-end-word](../assets/comparison-fib-end-word.png){ width="310" } | *not available for answer key format* :unamused: |

## Ordering (ORD)

> Respondus only imports ORD questions when specifying answers inline.

| Qcon | Respondus |
|:-------------:|:----------:|
![comparison-ord-end-word](../assets/comparison-ord-end-word.png){ width="310" } | *not available for answer key format* :unamused: |

## Question Type Differences

Migrating from Respondus may involve reviewing your documents for the question type codes that are used. Qcon accommodates Respondus question type codes, but uses lettering more congruent with the question type name:

|    Question Type   | QCon | Respondus |
|:-------------------|:----:|:---------:|
| Written Response   |  WR  | **E**     |
| Fill-in the Blanks |  FIB | **FMB**   |
| Multi-Select       |  MS  | **MR**    |
| Matching           |  MAT | **MT**    |
| Ordering           |  ORD | ORD       |
| Multiple Choice    |  MC  | MC        |
| True/False         |  TF  | TF        |

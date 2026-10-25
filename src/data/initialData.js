export const INITIAL_SUBJECTS = [
  {
    id: "sub-dsa",
    name: "DSA",
    description: "Data Structures & Algorithms in Java & C++",
    color: "#38bdf8", // Sky cyan
    icon: "Boxes",
    createdAt: "2026-10-20"
  },
  {
    id: "sub-oops",
    name: "OOPs",
    description: "Object Oriented Principles, Design Patterns & Architecture",
    color: "#a855f7", // Electric purple
    icon: "Layers",
    createdAt: "2026-10-21"
  },
  {
    id: "sub-java",
    name: "Java",
    description: "Modern Java 17/21, Concurrency, Streams & Core APIs",
    color: "#f59e0b", // Amber gold
    icon: "Coffee",
    createdAt: "2026-10-22"
  }
];

export const INITIAL_SNIPPETS = [
  // DSA SNIPPETS
  {
    id: "snip-dsa-1",
    subjectId: "sub-dsa",
    serialNumber: 1,
    title: "Binary Search (Iterative & Robust)",
    language: "java",
    tags: ["Searching", "Arrays", "O(log N)"],
    notes: "Avoid integer overflow by using low + (high - low) / 2 instead of (low + high) / 2. Array must be sorted.",
    createdAt: "2026-10-20",
    code: `public class BinarySearch {
    public static int search(int[] nums, int target) {
        int low = 0;
        int high = nums.length - 1;

        while (low <= high) {
            // Prevent integer overflow
            int mid = low + (high - low) / 2;

            if (nums[mid] == target) {
                return mid; // Found index
            } else if (nums[mid] < target) {
                low = mid + 1; // Search right half
            } else {
                high = mid - 1; // Search left half
            }
        }
        return -1; // Not found
    }

    public static void main(String[] args) {
        int[] arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        int target = 23;
        int result = search(arr, target);
        System.out.println("Element " + target + " found at index: " + result);
    }
}`
  },
  {
    id: "snip-dsa-2",
    subjectId: "sub-dsa",
    serialNumber: 2,
    title: "Two Sum using HashMap (O(N) Time)",
    language: "java",
    tags: ["Hash Table", "Arrays", "LeetCode 1"],
    notes: "Single pass hash table approach. Complements are checked in O(1) average time.",
    createdAt: "2026-10-21",
    code: `import java.util.HashMap;
import java.util.Map;

public class TwoSum {
    public static int[] findTwoSum(int[] nums, int target) {
        // Map: value -> index
        Map<Integer, Integer> map = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        throw new IllegalArgumentException("No two sum solution");
    }

    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        int[] indices = findTwoSum(nums, target);
        System.out.printf("Indices: [%d, %d]%n", indices[0], indices[1]);
    }
}`
  },
  {
    id: "snip-dsa-3",
    subjectId: "sub-dsa",
    serialNumber: 3,
    title: "Reverse a Singly Linked List (Iterative)",
    language: "java",
    tags: ["Linked List", "Pointers", "Classic"],
    notes: "Three pointers: prev, curr, next. In-place reversal with O(1) extra space.",
    createdAt: "2026-10-22",
    code: `class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

public class ReverseLinkedList {
    public static ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;

        while (curr != null) {
            ListNode nextTemp = curr.next; // store next node
            curr.next = prev;             // reverse current pointer
            prev = curr;                  // move prev forward
            curr = nextTemp;              // move curr forward
        }
        return prev; // new head
    }
}`
  },
  {
    id: "snip-dsa-4",
    subjectId: "sub-dsa",
    serialNumber: 4,
    title: "LRU Cache (HashMap + Doubly Linked List)",
    language: "java",
    tags: ["Design", "Doubly LinkedList", "O(1)"],
    notes: "O(1) get and put operations by combining a Hash Map with a Doubly Linked List for tracking least recently used items.",
    createdAt: "2026-10-23",
    code: `import java.util.HashMap;
import java.util.Map;

public class LRUCache {
    class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) { key = k; value = v; }
    }

    private final int capacity;
    private final Map<Integer, Node> map;
    private final Node head, tail;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new HashMap<>();
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head.next = tail;
        tail.prev = head;
    }

    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void insertToFront(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        remove(node);
        insertToFront(node);
        return node.value;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) {
            remove(map.get(key));
        }
        if (map.size() == capacity) {
            map.remove(tail.prev.key);
            remove(tail.prev);
        }
        Node newNode = new Node(key, value);
        insertToFront(newNode);
        map.put(key, newNode);
    }
}`
  },

  // OOPS SNIPPETS
  {
    id: "snip-oops-1",
    subjectId: "sub-oops",
    serialNumber: 1,
    title: "Runtime Polymorphism (Dynamic Method Dispatch)",
    language: "java",
    tags: ["Polymorphism", "Inheritance", "Overriding"],
    notes: "Demonstrates dynamic binding where method call is resolved at runtime based on the actual object instance, not reference type.",
    createdAt: "2026-10-21",
    code: `abstract class Payment {
    abstract void processPayment(double amount);
}

class UpiPayment extends Payment {
    private final String vpa;
    UpiPayment(String vpa) { this.vpa = vpa; }

    @Override
    void processPayment(double amount) {
        System.out.printf("Paid $%.2f via UPI ID: %s%n", amount, vpa);
    }
}

class CreditCardPayment extends Payment {
    private final String last4;
    CreditCardPayment(String last4) { this.last4 = last4; }

    @Override
    void processPayment(double amount) {
        System.out.printf("Charged $%.2f to Card ending in %s%n", amount, last4);
    }
}

public class PolymorphismDemo {
    public static void main(String[] args) {
        Payment p1 = new UpiPayment("alex@okhdfcbank");
        Payment p2 = new CreditCardPayment("4021");

        // Runtime dynamic dispatch
        p1.processPayment(150.00);
        p2.processPayment(320.50);
    }
}`
  },
  {
    id: "snip-oops-2",
    subjectId: "sub-oops",
    serialNumber: 2,
    title: "Thread-Safe Singleton (Bill Pugh Implementation)",
    language: "java",
    tags: ["Creational Pattern", "Concurrency", "Lazy Loading"],
    notes: "Bill Pugh singleton uses static inner helper class. Thread-safe without explicit synchronization overhead, loaded only on first call.",
    createdAt: "2026-10-22",
    code: `public class DatabaseConnectionPool {
    
    // Private constructor prevents direct instantiation
    private DatabaseConnectionPool() {
        System.out.println("Initializing Database Connection Pool...");
    }

    // Static inner helper class: only loaded when getInstance() is invoked
    private static class SingletonHelper {
        private static final DatabaseConnectionPool INSTANCE = new DatabaseConnectionPool();
    }

    public static DatabaseConnectionPool getInstance() {
        return SingletonHelper.INSTANCE;
    }

    public void executeQuery(String sql) {
        System.out.println("Executing query: " + sql);
    }

    public static void main(String[] args) {
        DatabaseConnectionPool pool1 = DatabaseConnectionPool.getInstance();
        DatabaseConnectionPool pool2 = DatabaseConnectionPool.getInstance();

        System.out.println("Same instance? " + (pool1 == pool2)); // true
    }
}`
  },
  {
    id: "snip-oops-3",
    subjectId: "sub-oops",
    serialNumber: 3,
    title: "Factory Method Pattern with Extensibility",
    language: "java",
    tags: ["Factory Pattern", "Decoupling", "Design Principles"],
    notes: "Decouples object creation logic from caller code. Adheres to Open-Closed Principle (OCP).",
    createdAt: "2026-10-23",
    code: `interface Notification {
    void notifyUser(String message);
}

class SMSNotification implements Notification {
    @Override
    public void notifyUser(String message) {
        System.out.println("Sending SMS: " + message);
    }
}

class EmailNotification implements Notification {
    @Override
    public void notifyUser(String message) {
        System.out.println("Sending Email: " + message);
    }
}

class PushNotification implements Notification {
    @Override
    public void notifyUser(String message) {
        System.out.println("Push Notification alert: " + message);
    }
}

class NotificationFactory {
    public static Notification createNotification(String channel) {
        if (channel == null || channel.isEmpty()) return null;
        return switch (channel.toUpperCase()) {
            case "SMS" -> new SMSNotification();
            case "EMAIL" -> new EmailNotification();
            case "PUSH" -> new PushNotification();
            default -> throw new IllegalArgumentException("Unknown channel: " + channel);
        };
    }
}`
  },

  // JAVA SNIPPETS
  {
    id: "snip-java-1",
    subjectId: "sub-java",
    serialNumber: 1,
    title: "Stream API Pipeline: Filter, Map & Collect",
    language: "java",
    tags: ["Java 8+", "Functional", "Streams"],
    notes: "Demonstrates declarative data processing: filtering, transforming, sorting, and grouping items into maps.",
    createdAt: "2026-10-22",
    code: `import java.util.*;
import java.util.stream.Collectors;

record Student(String name, String subject, int score) {}

public class StreamDemo {
    public static void main(String[] args) {
        List<Student> students = List.of(
            new Student("Aarav", "DSA", 95),
            new Student("Priya", "Java", 88),
            new Student("Rohan", "DSA", 72),
            new Student("Neha", "OOPs", 91),
            new Student("Karan", "Java", 94)
        );

        // 1. Filter students scoring >= 90 and get top names sorted
        List<String> topPerformers = students.stream()
            .filter(s -> s.score() >= 90)
            .sorted(Comparator.comparingInt(Student::score).reversed())
            .map(Student::name)
            .toList();

        System.out.println("Top Performers: " + topPerformers);

        // 2. Group by subject and calculate average score
        Map<String, Double> avgBySubject = students.stream()
            .collect(Collectors.groupingBy(
                Student::subject,
                Collectors.averagingInt(Student::score)
            ));

        System.out.println("Average by Subject: " + avgBySubject);
    }
}`
  },
  {
    id: "snip-java-2",
    subjectId: "sub-java",
    serialNumber: 2,
    title: "ExecutorService & ThreadPool Concurrency",
    language: "java",
    tags: ["Multithreading", "Executors", "Concurrency"],
    notes: "Thread management using FixedThreadPool. Avoid manually creating new Thread() objects to prevent resource exhaustion.",
    createdAt: "2026-10-23",
    code: `import java.util.concurrent.*;

public class ExecutorServiceDemo {
    public static void main(String[] args) throws InterruptedException {
        int cores = Runtime.getRuntime().availableProcessors();
        ExecutorService executor = Executors.newFixedThreadPool(cores);

        for (int i = 1; i <= 5; i++) {
            final int taskId = i;
            executor.submit(() -> {
                String threadName = Thread.currentThread().getName();
                System.out.printf("[%s] Started task #%d%n", threadName, taskId);
                try {
                    Thread.sleep(500); // simulate IO/CPU work
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                System.out.printf("[%s] Finished task #%d%n", threadName, taskId);
            });
        }

        executor.shutdown();
        boolean finished = executor.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println("All tasks finished? " + finished);
    }
}`
  },
  {
    id: "snip-java-3",
    subjectId: "sub-java",
    serialNumber: 3,
    title: "CompletableFuture Asynchronous Chaining",
    language: "java",
    tags: ["Async", "CompletableFuture", "Reactive"],
    notes: "Non-blocking async pipelines with thenApply, thenCompose, and exception handling using exceptionally.",
    createdAt: "2026-10-24",
    code: `import java.util.concurrent.CompletableFuture;

public class AsyncWorkflow {
    public static void main(String[] args) {
        CompletableFuture.supplyAsync(() -> {
            System.out.println("Fetching user profile data...");
            simulateDelay(600);
            return "User: JohnDoe";
        }).thenApply(user -> {
            System.out.println("Enriching with credit balance...");
            return user + " | Balance: $4,500";
        }).thenAccept(result -> {
            System.out.println("Final Result: " + result);
        }).exceptionally(ex -> {
            System.err.println("Failed with error: " + ex.getMessage());
            return null;
        }).join(); // wait for completion in main
    }

    private static void simulateDelay(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) {}
    }
}`
  }
];

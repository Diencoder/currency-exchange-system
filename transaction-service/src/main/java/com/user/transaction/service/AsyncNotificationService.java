package com.user.transaction.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service demonstrates Multithreading using @Async.
 */
@Service
@Slf4j
public class AsyncNotificationService {

    /**
     * Phương thức này sẽ chạy trong một luồng (Thread) riêng biệt.
     * Nó mô phỏng một tác vụ tốn thời gian như gửi Email hoặc SMS.
     */
    @Async("taskExecutor")
    public void sendTransactionNotification(Long transactionId, String type) {
        log.info("Bắt đầu gửi thông báo cho giao dịch {} [Thread: {}]", 
                 transactionId, Thread.currentThread().getName());
        
        try {
            // Mô phỏng độ trễ 3 giây (ví dụ: kết nối server email)
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            log.error("Lỗi trong quá trình gửi thông báo", e);
        }

        log.info("Đã gửi thông báo thành công cho giao dịch {}! [Thread: {}]", 
                 transactionId, Thread.currentThread().getName());
    }
}

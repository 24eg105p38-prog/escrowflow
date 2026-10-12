package com.escrowflow.service;

import com.escrowflow.dto.BidRequest;
import com.escrowflow.dto.JobRequest;
import com.escrowflow.model.Bid;
import com.escrowflow.model.Job;
import com.escrowflow.repository.BidRepository;
import com.escrowflow.repository.JobRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final BidRepository bidRepository;
    private final NotificationService notificationService;

    public JobService(JobRepository jobRepository, BidRepository bidRepository, NotificationService notificationService) {
        this.jobRepository = jobRepository;
        this.bidRepository = bidRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Job createJob(Long clientId, JobRequest request) {
        Job job = new Job();
        job.setClientId(clientId);
        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setCategory(request.getCategory());
        job.setBudget(request.getBudget());
        job.setStatus("OPEN");
        return jobRepository.create(job);
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public List<Job> getJobsByClient(Long clientId) {
        return jobRepository.findByClientId(clientId);
    }

    public Job getJobById(Long id) {
        return jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found with ID: " + id));
    }

    @Transactional
    public Bid submitBid(Long jobId, Long freelancerId, BidRequest request) {
        Job job = getJobById(jobId);
        if (!"OPEN".equalsIgnoreCase(job.getStatus())) {
            throw new RuntimeException("Cannot bid on job that is not OPEN");
        }

        Bid bid = new Bid();
        bid.setJobId(jobId);
        bid.setFreelancerId(freelancerId);
        bid.setProposedAmount(request.getProposedAmount());
        bid.setProposedTimeline(request.getProposedTimeline());
        bid.setProposalText(request.getProposalText());
        bid.setStatus("PENDING");

        Bid created = bidRepository.create(bid);

        // Notify client
        notificationService.notifyUser(
                job.getClientId(),
                freelancerId,
                null,
                null,
                "New bid received: $" + request.getProposedAmount() + " for job '" + job.getTitle() + "'"
        );

        return created;
    }

    public List<Bid> getBidsForJob(Long jobId) {
        return bidRepository.findByJobId(jobId);
    }

    public List<Bid> getBidsByFreelancer(Long freelancerId) {
        return bidRepository.findByFreelancerId(freelancerId);
    }
}

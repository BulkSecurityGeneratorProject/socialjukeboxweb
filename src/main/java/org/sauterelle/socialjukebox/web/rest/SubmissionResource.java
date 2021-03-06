package org.sauterelle.socialjukebox.web.rest;

import com.codahale.metrics.annotation.Timed;

import org.apache.commons.lang.StringUtils;
import org.sauterelle.socialjukebox.service.LastFmService;
import org.sauterelle.socialjukebox.service.SubmissionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.inject.Inject;

/**
 * Created by William on 09/04/2015.
 */
@RestController
@RequestMapping("/api")
public class SubmissionResource {

    private final Logger log = LoggerFactory.getLogger(SubmissionResource.class);
    @Inject
    private SubmissionService submissionService;
    @Inject
    private LastFmService lastFmService;
    /**
     * POST  /submission/submit -> get a string submitted
     */
    @RequestMapping(value = "/submission/submit",
            method = RequestMethod.POST,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @Timed
    public ResponseEntity<?> submit(@RequestParam String name, @RequestParam Long idPlaylist) {
        if (StringUtils.isEmpty(name) || idPlaylist==null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        submissionService.submit(name, idPlaylist);
        return new ResponseEntity<>(HttpStatus.OK);
    }
    @RequestMapping(value = "/submission/test",
            method = RequestMethod.GET,
            produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    @Timed
    public String test() {
    	log.debug("Get method on submission test");
    	return lastFmService.search("");
    }


}

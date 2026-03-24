// The 'test_leo' test program.
import leo.aleo;
program test_leo.aleo {
    @test
    script test_it() {
        let result: u32 = leo.aleo/main(1u32, 2u32);
        assert_eq(result, 3u32);
    }

    @test
    @should_fail
    transition do_nothing() {
        let result: u32 = leo.aleo/main(2u32, 3u32);
        assert_eq(result, 3u32);
    }

    @noupgrade
    async constructor() {}
}

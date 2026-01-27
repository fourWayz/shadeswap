// The 'test_private_reputation_system' test program.
import private_reputation_system.aleo;
program test_private_reputation_system.aleo {
    @test
    script test_it() {
        let result: u32 = private_reputation_system.aleo/main(1u32, 2u32);
        assert_eq(result, 3u32);
    }

    @test
    @should_fail
    transition do_nothing() {
        let result: u32 = private_reputation_system.aleo/main(2u32, 3u32);
        assert_eq(result, 3u32);
    }

    @noupgrade
    async constructor() {}
}
